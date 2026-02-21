import React, { useState } from 'react';
import * as THREE from 'three';

interface MoveArrowProps {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  onClick: (e: THREE.Event) => void;
  isFocused?: boolean;
}

export const MoveArrow: React.FC<MoveArrowProps> = ({ position, direction, onClick, isFocused }) => {
  const [hovered, setHovered] = useState(false);
  
  // Point the cone in the direction
  const defaultUp = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultUp, direction.clone().normalize());

  const active = hovered || isFocused;

  return (
    <group position={position} quaternion={quaternion} 
      onClick={(e) => { 
        e.stopPropagation(); 
        onClick(e); 
      }}
      onPointerDown={(e) => e.stopPropagation()} // Prevent triggering drag/select on the cube background
      onPointerUp={(e) => e.stopPropagation()}   // Prevent triggering selection logic
      onPointerOver={(e) => { 
        e.stopPropagation(); 
        setHovered(true); 
        document.body.style.cursor = 'pointer'; 
      }}
      onPointerOut={(e) => { 
        e.stopPropagation(); 
        setHovered(false); 
        document.body.style.cursor = 'grab'; // Revert to default grab cursor
      }}
    >
      {/* Hit box for easier clicking */}
      <mesh visible={false}>
         <boxGeometry args={[0.6, 1.2, 0.6]} />
         <meshBasicMaterial />
      </mesh>

      {/* Visual Arrow */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.2, 0.5, 16]} />
        <meshStandardMaterial 
          color={active ? "#00ff88" : "#ffffff"} 
          emissive={active ? "#00ff88" : "#444444"} 
          emissiveIntensity={active ? 0.8 : 0.2} 
        />
      </mesh>
    </group>
  );
};