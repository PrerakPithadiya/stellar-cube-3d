import React, { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { Cubie } from './Cubie';
import { MoveArrow } from './MoveArrow';
import { CubieData } from '../types';
import { roundVector, getDominantAxis, isClose } from '../utils/cubeMath';

export interface RubiksCubeHandle {
  shuffle: () => Promise<void>;
  deselect: () => void;
}

interface RubiksCubeProps {
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  onMoveComplete?: () => void;
  mode: 'layer' | 'cube';
}

/**
 * Calculates a robust local coordinate system (Basis) for a given face normal.
 * This ensures "Up" (v) and "Right" (u) arrows are visually intuitive.
 */
const getFaceBasis = (normal: THREE.Vector3) => {
  const u = new THREE.Vector3();
  const v = new THREE.Vector3();
  
  // Normalize just in case
  const n = normal.clone().normalize();

  // 1. Determine "Visual Up" (v)
  // If the face is vertical (Side faces: Front, Back, Left, Right), World Up (0,1,0) is visual Up.
  if (Math.abs(n.y) < 0.9) {
      v.set(0, 1, 0); 
  } else {
      // Horizontal faces (Top, Bottom)
      // For Top (+Y), "Up" visually points to Back (-Z).
      if (n.y > 0) {
          v.set(0, 0, -1);
      } else {
          // For Bottom (-Y), "Up" visually points to Front (+Z).
          v.set(0, 0, 1);
      }
  }

  // 2. Determine "Visual Right" (u)
  // Cross product of Visual Up and Normal gives Right.
  u.crossVectors(v, n).normalize();
  
  // 3. Re-orthogonalize v just to be mathematically perfect (v = n x u)
  v.crossVectors(n, u).normalize();

  return { u, v };
};

const getFaceName = (normal: THREE.Vector3): string => {
  const axis = getDominantAxis(normal);
  if (axis === 'x') return normal.x > 0 ? 'right' : 'left';
  if (axis === 'y') return normal.y > 0 ? 'top' : 'bottom';
  return normal.z > 0 ? 'front' : 'back';
};

// Explicit Mapping for Face/Arrow -> Rotation Axis & Direction
// This fixes inversion bugs by manually defining the correct rotation for each visual arrow.
const ROTATION_MAP: Record<string, Record<string, { axis: 'x'|'y'|'z', scale: number }>> = {
  front: { // +Z
    v: { axis: 'x', scale: -1 },  // Up -> Rot -X
    '-v': { axis: 'x', scale: 1 }, // Down -> Rot +X
    // FIXED: Right Arrow (u) should move Front -> Right (+X), which is +Y Rotation
    u: { axis: 'y', scale: 1 },    
    // FIXED: Left Arrow (-u) should move Front -> Left (-X), which is -Y Rotation
    '-u': { axis: 'y', scale: -1 },  
  },
  back: { // -Z
    v: { axis: 'x', scale: 1 },    // Up -> Rot +X (Back -> Top)
    '-v': { axis: 'x', scale: -1 },
    // FIXED: Right Arrow (u) on Back Face (Visual -X) should move to -X. +Y Rot moves Back(-Z) -> Left(-X).
    u: { axis: 'y', scale: 1 },   
    // FIXED: Left Arrow (-u) on Back Face (Visual +X) should move to +X. -Y Rot moves Back(-Z) -> Right(+X).
    '-u': { axis: 'y', scale: -1 },
  },
  right: { // +X
    v: { axis: 'z', scale: 1 },    // Up -> Rot +Z (Right -> Top)
    '-v': { axis: 'z', scale: -1 },
    u: { axis: 'y', scale: 1 },    // Right (Visual -Z) -> Rot +Y (Right -> Back)
    '-u': { axis: 'y', scale: -1 },
  },
  left: { // -X
    v: { axis: 'z', scale: -1 },   // Up -> Rot -Z (Left -> Top)
    '-v': { axis: 'z', scale: 1 },
    u: { axis: 'y', scale: 1 },    // Right (Visual +Z) -> Rot +Y (Left -> Front)
    '-u': { axis: 'y', scale: -1 },
  },
  top: { // +Y
    v: { axis: 'x', scale: -1 },   // Up (Visual -Z) -> Rot -X (Top -> Back)
    '-v': { axis: 'x', scale: 1 },
    u: { axis: 'z', scale: -1 },   // Right (Visual +X) -> Rot -Z (Top -> Right)
    '-u': { axis: 'z', scale: 1 },
  },
  bottom: { // -Y
     v: { axis: 'x', scale: -1 },  // Up (Visual +Z) -> Rot -X (Bottom -> Front)
     '-v': { axis: 'x', scale: 1 },
     u: { axis: 'z', scale: 1 },   // Right (Visual +X) -> Rot +Z (Bottom -> Right)
     '-u': { axis: 'z', scale: -1 },
  }
};

type ArrowDir = 'u' | '-u' | 'v' | '-v';

export const RubiksCube = forwardRef<RubiksCubeHandle, RubiksCubeProps>(({ isLocked, setIsLocked, onMoveComplete, mode }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const cubieRefs = useRef<(THREE.Group | null)[]>([]); 
  const { camera, gl, raycaster } = useThree();

  // Internal State
  const [cubies] = useState<CubieData[]>(() => {
    const c: CubieData[] = [];
    let id = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          c.push({ id: id++, initialPosition: new THREE.Vector3(x, y, z) });
        }
      }
    }
    return c;
  });

  // Selection State
  const [selection, setSelection] = useState<{
    type: 'layer' | 'cube';
    cubieId?: number;           
    faceCubieIds?: number[];    
    faceNormal: THREE.Vector3;  
    faceName: string; // Added to store identified face
    center: THREE.Vector3;      
    u: THREE.Vector3;           
    v: THREE.Vector3;           
  } | null>(null);

  const [focusedArrow, setFocusedArrow] = useState<ArrowDir | null>(null);

  // Drag interaction tracking
  const interactionRef = useRef({
    startX: 0,
    startY: 0,
  });

  // --- CORE ANIMATION & ROTATION LOGIC ---

  const animateRotation = (
    targetObj: THREE.Object3D, 
    axis: THREE.Vector3, 
    angle: number, 
    duration: number,
    onComplete: () => void
  ) => {
      const startQ = targetObj.quaternion.clone();
      const tempQ = new THREE.Quaternion().setFromAxisAngle(axis.normalize(), angle);
      // Pre-multiply to apply world-axis rotation to the object
      const endQ = startQ.clone().premultiply(tempQ);
      
      const progress = { t: 0 };
      gsap.to(progress, {
          t: 1,
          duration: duration,
          ease: "power2.inOut",
          onUpdate: () => {
              targetObj.quaternion.slerpQuaternions(startQ, endQ, progress.t);
          },
          onComplete: () => {
              targetObj.quaternion.copy(endQ);
              onComplete();
          }
      });
  };

  const handleArrowClick = (arrowKey: ArrowDir) => {
      if (!selection || !groupRef.current) return;

      // Use explicit map instead of cross-product to avoid inversion bugs
      const moveConfig = ROTATION_MAP[selection.faceName]?.[arrowKey];
      
      if (!moveConfig) {
          console.error("No move config found for", selection.faceName, arrowKey);
          return;
      }

      // Create Axis Vector from Config
      const rotAxis = new THREE.Vector3();
      rotAxis[moveConfig.axis] = 1; // e.g. (1,0,0) for 'x'
      
      const scale = moveConfig.scale;
      const angle = (Math.PI / 2) * scale;

      // Clear selection UI immediately
      setSelection(null);
      setFocusedArrow(null);
      setIsLocked(true);

      if (mode === 'cube') {
          // --- WHOLE CUBE ROTATION ---
          // Rotate the entire group container
          animateRotation(groupRef.current, rotAxis, angle, 0.5, () => {
              setIsLocked(false);
          });

      } else {
          // --- LAYER ROTATION ---
          const worldAxis = rotAxis.clone();
          const localAxis = worldAxis.clone().transformDirection(groupRef.current.matrixWorld.clone().invert());
          roundVector(localAxis);
          const localAxisName = getDominantAxis(localAxis);
          
          // Use sign of local axis to adjust rotation direction relative to the cubie's current orientation
          const localSign = Math.sign(localAxis[localAxisName]);

          const targetCubie = cubieRefs.current.find(c => c && parseInt(c.name) === selection.cubieId);
          if (!targetCubie) return; 
          
          const localPos = targetCubie.position.clone();
          roundVector(localPos);
          const layerIndex = localPos[localAxisName]; 

          const targetCubies: THREE.Object3D[] = [];
          cubieRefs.current.forEach(c => {
              if(!c) return;
              const p = c.position.clone();
              roundVector(p);
              if (isClose(p[localAxisName], layerIndex)) {
                  targetCubies.push(c);
              }
          });

          // Create Pivot
          const pivot = new THREE.Object3D();
          pivot.rotation.set(0,0,0);
          groupRef.current.add(pivot);
          targetCubies.forEach(c => pivot.attach(c));

          // Animate Pivot
          // We multiply by localSign because a World +X rotation might be Local -X rotation if cube is flipped
          const targetAngle = angle * localSign; 

          gsap.to(pivot.rotation, {
              [localAxisName]: targetAngle,
              duration: 0.3,
              ease: "back.out(0.8)",
              onComplete: () => {
                  targetCubies.forEach(c => {
                      groupRef.current?.attach(c);
                      c.position.copy(roundVector(c.position));
                      c.rotation.x = Math.round(c.rotation.x / (Math.PI/2)) * (Math.PI/2);
                      c.rotation.y = Math.round(c.rotation.y / (Math.PI/2)) * (Math.PI/2);
                      c.rotation.z = Math.round(c.rotation.z / (Math.PI/2)) * (Math.PI/2);
                      c.updateMatrixWorld();
                  });
                  groupRef.current?.remove(pivot);
                  setIsLocked(false);
                  if (onMoveComplete) onMoveComplete();
              }
          });
      }
  };

  // --- RAYCASTING & SELECTION ---

  const onPointerDown = (e: THREE.Event) => {
    if (isLocked) return; 
    if ((e.nativeEvent as PointerEvent).button !== 0) return;
    interactionRef.current.startX = e.nativeEvent.clientX;
    interactionRef.current.startY = e.nativeEvent.clientY;
  };

  const onPointerUp = (e: THREE.Event) => {
    if (isLocked) return;

    const dist = Math.sqrt(
        Math.pow(e.nativeEvent.clientX - interactionRef.current.startX, 2) +
        Math.pow(e.nativeEvent.clientY - interactionRef.current.startY, 2)
    );
    if (dist > 5) return; 

    e.stopPropagation();

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((e.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.nativeEvent.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const validCubies = cubieRefs.current.filter((c) => c !== null) as THREE.Group[];
    const intersects = raycaster.intersectObjects(validCubies, true);

    if (intersects.length > 0) {
        const firstHit = intersects[0];
        
        let hitObj = firstHit.object;
        let cubieGroup: THREE.Object3D | null = null;
        while(hitObj.parent && hitObj.parent !== groupRef.current) {
            if (hitObj.parent.name) {
                cubieGroup = hitObj.parent;
                break;
            }
            hitObj = hitObj.parent;
        }

        if (cubieGroup && cubieGroup.name) {
             const cubieId = parseInt(cubieGroup.name);
             
             // Determine World Face Normal
             const normal = firstHit.face?.normal.clone() || new THREE.Vector3(0,1,0);
             normal.transformDirection(firstHit.object.matrixWorld).normalize();

             // Snap to nearest axis (World Space)
             const axisName = getDominantAxis(normal); 
             const sign = Math.sign(normal[axisName]) || 1;
             const snappedNormal = new THREE.Vector3();
             snappedNormal[axisName] = sign;

             const faceName = getFaceName(snappedNormal);
             
             // Calculate Basis (U/V) for arrows
             const { u, v } = getFaceBasis(snappedNormal);

             if (mode === 'cube') {
                 // --- WHOLE CUBE SELECTION ---
                 const worldPos = new THREE.Vector3();
                 cubieGroup.getWorldPosition(worldPos);
                 roundVector(worldPos);
                 
                 const faceCoord = worldPos[axisName]; 
                 
                 const faceCenter = new THREE.Vector3();
                 faceCenter[axisName] = faceCoord; 

                 const faceCubieIds: number[] = [];
                 cubieRefs.current.forEach((ref) => {
                     if (!ref) return;
                     const cPos = new THREE.Vector3();
                     ref.getWorldPosition(cPos);
                     roundVector(cPos);
                     if (isClose(cPos[axisName], faceCoord)) {
                         if (ref.name) faceCubieIds.push(parseInt(ref.name));
                     }
                 });

                 setSelection({
                     type: 'cube',
                     faceCubieIds,
                     faceNormal: snappedNormal,
                     faceName,
                     center: faceCenter,
                     u, v
                 });

             } else {
                 // --- LAYER SELECTION ---
                 const worldPos = new THREE.Vector3();
                 cubieGroup.getWorldPosition(worldPos);
                 roundVector(worldPos);

                 setSelection({
                     type: 'layer',
                     cubieId,
                     faceNormal: snappedNormal,
                     faceName,
                     center: worldPos,
                     u, v
                 });
             }
             setFocusedArrow(null);
        }
    } else {
        setSelection(null);
        setFocusedArrow(null);
    }
  };

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!selection || isLocked) return;
        if (e.key === 'ArrowRight') setFocusedArrow('u');
        if (e.key === 'ArrowLeft') setFocusedArrow('-u');
        if (e.key === 'ArrowUp') setFocusedArrow('v');
        if (e.key === 'ArrowDown') setFocusedArrow('-v');
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (focusedArrow) handleArrowClick(focusedArrow);
        }
        if (e.key === 'Escape') {
            setSelection(null);
            setFocusedArrow(null);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, focusedArrow, isLocked]);

  // Expose
  useImperativeHandle(ref, () => ({
    shuffle: async () => {
      setSelection(null);
      const moves = 20; 
      const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
      const layers = [-1, 0, 1];
      const directions = [1, -1];

      const performShuffleMove = (axis: string, layer: number, dir: number) => {
          return new Promise<void>(resolve => {
              const targetCubies: THREE.Object3D[] = [];
              cubieRefs.current.forEach(c => {
                  if(!c) return;
                  const p = c.position.clone();
                  roundVector(p);
                  if (Math.abs(p[axis as 'x'|'y'|'z'] - layer) < 0.1) targetCubies.push(c);
              });
              
              const pivot = new THREE.Object3D();
              groupRef.current?.add(pivot);
              targetCubies.forEach(c => pivot.attach(c));
              
              gsap.to(pivot.rotation, {
                  [axis]: (Math.PI/2) * dir,
                  duration: 0.15,
                  onComplete: () => {
                    targetCubies.forEach(c => {
                        groupRef.current?.attach(c);
                        c.position.copy(roundVector(c.position));
                        c.rotation.x = Math.round(c.rotation.x / (Math.PI/2)) * (Math.PI/2);
                        c.rotation.y = Math.round(c.rotation.y / (Math.PI/2)) * (Math.PI/2);
                        c.rotation.z = Math.round(c.rotation.z / (Math.PI/2)) * (Math.PI/2);
                        c.updateMatrixWorld();
                    });
                    groupRef.current?.remove(pivot);
                    resolve();
                  }
              });
          });
      };

      for (let i = 0; i < moves; i++) {
        const randomAxis = axes[Math.floor(Math.random() * axes.length)];
        const randomLayer = layers[Math.floor(Math.random() * layers.length)];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        await performShuffleMove(randomAxis, randomLayer, randomDir);
      }
    },
    deselect: () => {
        setSelection(null);
        setFocusedArrow(null);
    }
  }));

  // --- ARROW RENDERING HELPERS ---
  
  const renderArrow = (key: ArrowDir, uDir: number, vDir: number) => {
      if (!selection || !groupRef.current) return null;

      const worldPos = selection.center.clone()
        .add(selection.faceNormal.clone().multiplyScalar(1.2))
        .add(selection.u.clone().multiplyScalar(uDir * 1.2))
        .add(selection.v.clone().multiplyScalar(vDir * 1.2));

      const worldDir = selection.u.clone().multiplyScalar(uDir)
        .add(selection.v.clone().multiplyScalar(vDir)).normalize();

      const invMatrix = groupRef.current.matrixWorld.clone().invert();
      const localPos = worldPos.clone().applyMatrix4(invMatrix);
      const localDir = worldDir.clone().transformDirection(invMatrix).normalize();

      return (
          <MoveArrow 
            key={key}
            position={localPos}
            direction={localDir}
            onClick={() => handleArrowClick(key)}
            isFocused={focusedArrow === key}
          />
      );
  };

  return (
    <group 
      ref={groupRef} 
      onPointerDown={onPointerDown} 
      onPointerUp={onPointerUp}
    >
      {cubies.map((cubie, i) => {
        let isHighlighted = false;
        if (selection?.type === 'layer' && selection.cubieId === cubie.id) {
            isHighlighted = true;
        } else if (selection?.type === 'cube' && selection.faceCubieIds?.includes(cubie.id)) {
            isHighlighted = true;
        }

        return (
            <Cubie
            key={cubie.id}
            ref={(el) => (cubieRefs.current[i] = el)}
            position={cubie.initialPosition}
            name={cubie.id.toString()}
            highlight={isHighlighted}
            />
        );
      })}

      {/* Render Arrows */}
      {selection && !isLocked && (
        <>
            {renderArrow('u', 1, 0)}   {/* Right */}
            {renderArrow('-u', -1, 0)} {/* Left */}
            {renderArrow('v', 0, 1)}   {/* Up */}
            {renderArrow('-v', 0, -1)} {/* Down */}
        </>
      )}
    </group>
  );
});

RubiksCube.displayName = "RubiksCube";