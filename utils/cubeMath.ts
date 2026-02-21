import * as THREE from 'three';

// Round vector components to nearest integer to prevent floating point drift
export const roundVector = (v: THREE.Vector3): THREE.Vector3 => {
  v.x = Math.round(v.x);
  v.y = Math.round(v.y);
  v.z = Math.round(v.z);
  return v;
};

// Check if two values are roughly equal
export const isClose = (a: number, b: number) => Math.abs(a - b) < 0.1;

// Determine which axis corresponds to a world vector
export const getDominantAxis = (v: THREE.Vector3): 'x' | 'y' | 'z' => {
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  const az = Math.abs(v.z);
  if (ax > ay && ax > az) return 'x';
  if (ay > ax && ay > az) return 'y';
  return 'z';
};
