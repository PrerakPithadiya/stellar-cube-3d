import React, { useLayoutEffect, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Color } from '../types';

interface CubieProps {
  position: THREE.Vector3;
  name: string; 
  highlight?: boolean;
}

// Materials definition - Updated to match standard Western color scheme:
// Right(+x)=Blue, Left(-x)=Green, Top(+y)=White, Bottom(-y)=Yellow, Front(+z)=Red, Back(-z)=Orange
const materials = [
  new THREE.MeshStandardMaterial({ color: Color.BLUE, roughness: 0.1, metalness: 0.1 }),    // Right (+x)
  new THREE.MeshStandardMaterial({ color: Color.GREEN, roughness: 0.1, metalness: 0.1 }),   // Left (-x)
  new THREE.MeshStandardMaterial({ color: Color.WHITE, roughness: 0.1, metalness: 0.1 }),   // Top (+y)
  new THREE.MeshStandardMaterial({ color: Color.YELLOW, roughness: 0.1, metalness: 0.1 }),  // Bottom (-y)
  new THREE.MeshStandardMaterial({ color: Color.RED, roughness: 0.1, metalness: 0.1 }),     // Front (+z)
  new THREE.MeshStandardMaterial({ color: Color.ORANGE, roughness: 0.1, metalness: 0.1 }),  // Back (-z)
];

export const Cubie = React.forwardRef<THREE.Group, CubieProps>(({ position, name, highlight }, ref) => {
  const localRef = useRef<THREE.Group>(null);

  // Sync the local ref with the external ref passed from parent
  React.useImperativeHandle(ref, () => localRef.current!);

  // Set initial position only once on mount.
  // We intentionally do NOT include 'position' in the dependency array or pass it to the <group>.
  // This prevents React from overwriting the position after we have animated it imperatively.
  useLayoutEffect(() => {
    if (localRef.current) {
      localRef.current.position.copy(position);
    }
  }, []); 

  return (
    <group ref={localRef} name={name}>
       {/* Main plastic body - Emissive when highlighted */}
      <RoundedBox 
        args={[1, 1, 1]} 
        radius={0.08} 
        smoothness={4}
        userData={{ isCubie: true }}
      >
         <meshStandardMaterial 
            vertexColors={false} 
            color={Color.BLACK} 
            roughness={0.5} 
            emissive={highlight ? "#555555" : "#000000"} // Increased brightness for better visibility
            emissiveIntensity={highlight ? 0.8 : 0}
         />
      </RoundedBox>

      {/* Stickers */}
      <mesh position={[0.505, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <primitive object={materials[0]} attach="material" />
      </mesh>
      <mesh position={[-0.505, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <primitive object={materials[1]} attach="material" />
      </mesh>
      <mesh position={[0, 0.505, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <primitive object={materials[2]} attach="material" />
      </mesh>
      <mesh position={[0, -0.505, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <primitive object={materials[3]} attach="material" />
      </mesh>
       <mesh position={[0, 0, 0.505]}>
        <planeGeometry args={[0.85, 0.85]} />
        <primitive object={materials[4]} attach="material" />
      </mesh>
      <mesh position={[0, 0, -0.505]} rotation={[Math.PI, 0, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <primitive object={materials[5]} attach="material" />
      </mesh>
    </group>
  );
});

Cubie.displayName = 'Cubie';