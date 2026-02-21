import * as THREE from 'three';

export type Vector3 = [number, number, number];

export enum Color {
  WHITE = '#ffffff', // U
  YELLOW = '#ffd500', // D
  BLUE = '#0046ad', // F
  GREEN = '#009b48', // B
  RED = '#b71234', // R
  ORANGE = '#ff5800', // L
  BLACK = '#1a1a1a', // Internal/Plastic
}

export interface CubieData {
  id: number;
  initialPosition: THREE.Vector3; // Logic position (x,y,z where values are -1, 0, 1)
}

export type Axis = 'x' | 'y' | 'z';
