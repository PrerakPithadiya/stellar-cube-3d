import React, { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { RubiksCube, RubiksCubeHandle } from './components/RubiksCube';

export default function App() {
  const [isLocked, setIsLocked] = useState(false); // Internal lock for animations
  const [isShuffling, setIsShuffling] = useState(false);
  const [isViewLocked, setIsViewLocked] = useState(false); // Camera position lock
  const [interactionMode, setInteractionMode] = useState<'layer' | 'cube'>('layer');
  const cubeRef = useRef<RubiksCubeHandle>(null);
  const controlsRef = useRef<any>(null); // Ref to OrbitControls

  const handleShuffle = async () => {
    if (isShuffling || isLocked || !cubeRef.current) return;
    
    setIsShuffling(true);
    await cubeRef.current.shuffle();
    setIsShuffling(false);
  };

  // Zoom Logic
  const performZoom = (direction: 'in' | 'out') => {
    // If view is locked or animations playing, disable zoom
    if (isLocked || isShuffling || isViewLocked) return;

    const controls = controlsRef.current;
    if (!controls || !controls.object) return;

    const camera = controls.object;
    const target = controls.target;
    // 15% step
    const ZOOM_FACTOR = 0.15; 

    if (camera.isPerspectiveCamera) {
      // Calculate current distance
      const distance = camera.position.distanceTo(target);
      const minDist = controls.minDistance || 0;
      const maxDist = controls.maxDistance || Infinity;

      let newDistance = distance;
      if (direction === 'in') {
        newDistance = distance * (1 - ZOOM_FACTOR);
        if (newDistance < minDist) newDistance = minDist;
      } else {
        newDistance = distance * (1 + ZOOM_FACTOR);
        if (newDistance > maxDist) newDistance = maxDist;
      }

      // Move camera along the vector towards/away from target
      const directionVec = new THREE.Vector3().subVectors(camera.position, target).normalize();
      camera.position.copy(target).add(directionVec.multiplyScalar(newDistance));
      
      controls.update();
    } else if (camera.isOrthographicCamera) {
      // Handle orthographic zoom if we ever switch
      if (direction === 'in') {
        camera.zoom = Math.min(camera.zoom / (1 - ZOOM_FACTOR), controls.maxZoom || 100);
      } else {
        camera.zoom = Math.max(camera.zoom * (1 - ZOOM_FACTOR), controls.minZoom || 0.1);
      }
      camera.updateProjectionMatrix();
      controls.update();
    }
  };

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 'L' to toggle view lock
      if (e.key.toLowerCase() === 'l') {
        setIsViewLocked((prev) => !prev);
      }
      
      // Zoom shortcuts
      if (e.key === '+' || e.key === '=') {
        performZoom('in');
      }
      if (e.key === '-' || e.key === '_') {
        performZoom('out');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, isShuffling, isViewLocked]); // Re-bind when lock state changes so performZoom sees fresh state

  const areControlsDisabled = isLocked || isShuffling || isViewLocked;

  return (
    <div className="relative w-full h-screen bg-neutral-900 overflow-hidden font-sans text-white">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none">
        <h1 className="text-4xl font-bold tracking-tighter mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          RUBIK'S 3D
        </h1>
        <p className="text-neutral-400 text-sm max-w-xs">
          Interactive WebGL Experience.
        </p>
      </div>

      {/* Mode Selector - Top Center */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 flex bg-neutral-800/80 backdrop-blur-md rounded-full p-1 border border-neutral-700 shadow-2xl">
        <button
          onClick={() => setInteractionMode('layer')}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
            interactionMode === 'layer' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          LAYER MOVE
        </button>
        <button
          onClick={() => setInteractionMode('cube')}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
            interactionMode === 'cube' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          ROTATE CUBE
        </button>
      </div>

      {/* Top Right Controls Group */}
      <div className="absolute top-6 right-6 z-20 flex gap-3 items-center">
        {/* Lock View Button */}
        <button
          onClick={() => setIsViewLocked(!isViewLocked)}
          title="Press 'L' to toggle lock"
          className={`
            px-6 py-3 rounded-lg font-bold tracking-wide text-sm
            shadow-lg backdrop-blur-md transition-all duration-300 transform
            flex items-center gap-2
            ${isViewLocked 
              ? 'bg-neutral-600 hover:bg-neutral-500 text-neutral-200' // Locked state
              : 'bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 text-white' // Unlocked state
            }
          `}
        >
          {isViewLocked ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              UNLOCK CUBE
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
              </svg>
              LOCK CUBE
            </>
          )}
        </button>

        {/* Shuffle Button */}
        <button
          onClick={handleShuffle}
          disabled={isShuffling || isLocked}
          className={`
            px-6 py-3 rounded-lg font-bold tracking-wide text-sm
            shadow-lg backdrop-blur-md transition-all duration-300 transform
            ${isShuffling 
              ? 'bg-neutral-700/50 text-neutral-400 cursor-not-allowed scale-95' 
              : 'bg-green-600 hover:bg-green-500 hover:scale-105 text-white cursor-pointer active:scale-95'
            }
          `}
        >
          {isShuffling ? 'SHUFFLING...' : 'SHUFFLE'}
        </button>
      </div>

      {/* Zoom Controls - Vertical Stack Below Top Right Buttons */}
      <div className="absolute top-24 right-6 z-20 flex flex-col gap-2">
        <button
          onClick={() => performZoom('in')}
          disabled={areControlsDisabled}
          title="Zoom In (+)"
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            font-bold text-xl shadow-lg backdrop-blur-md transition-all duration-300
            ${areControlsDisabled
              ? 'bg-neutral-700/50 text-neutral-500 cursor-not-allowed'
              : 'bg-neutral-700 hover:bg-neutral-600 text-white hover:scale-110 active:scale-95'
            }
          `}
        >
          +
        </button>
        <button
          onClick={() => performZoom('out')}
          disabled={areControlsDisabled}
          title="Zoom Out (-)"
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            font-bold text-xl shadow-lg backdrop-blur-md transition-all duration-300
            ${areControlsDisabled
              ? 'bg-neutral-700/50 text-neutral-500 cursor-not-allowed'
              : 'bg-neutral-700 hover:bg-neutral-600 text-white hover:scale-110 active:scale-95'
            }
          `}
        >
          −
        </button>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-10 left-0 w-full flex flex-col items-center gap-4 z-20 pointer-events-none">
        {/* Instructions */}
        <div className="bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-xl">
          <p className="text-xs font-medium text-white/70">
            {interactionMode === 'layer' 
              ? 'Mode: LAYER MOVE • Click a piece to rotate a slice' 
              : 'Mode: WHOLE CUBE • Click a face to rotate the entire cube'
            }
          </p>
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas
        camera={{ position: [5, 4, 6], fov: 45 }}
        className="cursor-grab active:cursor-grabbing"
        shadows
        dpr={[1, 2]} 
        onPointerMissed={() => cubeRef.current?.deselect()}
      >
        <color attach="background" args={['#111']} />
        
        <ambientLight intensity={0.6} />
        <spotLight 
          position={[10, 10, 10]} 
          angle={0.15} 
          penumbra={1} 
          intensity={1.5} 
          castShadow 
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Environment preset="city" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <Suspense fallback={null}>
          <RubiksCube 
            ref={cubeRef}
            isLocked={isLocked || isShuffling} 
            setIsLocked={setIsLocked}
            mode={interactionMode}
          />
        </Suspense>

        <OrbitControls 
          ref={controlsRef}
          enablePan={false} 
          enableDamping 
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={15}
          // Orbit is enabled only if no animation is playing (isLocked), 
          // not shuffling, AND view is not explicitly locked by user
          enabled={!areControlsDisabled} 
        />
      </Canvas>
    </div>
  );
}