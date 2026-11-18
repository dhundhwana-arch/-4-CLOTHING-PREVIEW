import * as THREE from 'three';
import type { CameraPresetId } from '../../types/preview';

/**
 * Camera preset system. Pure math — fully unit-testable without WebGL.
 *
 * The shirt model is centred at the origin, front facing +Z
 * (see shirtModelBuilder.ts). Presets place the camera on each axis at a
 * fixed distance with a slight downward tilt for a natural product view.
 */

export interface CameraPreset {
  id: CameraPresetId;
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export const CAMERA_DISTANCE = 3.1;
export const CAMERA_HEIGHT = 0.35;
export const CAMERA_TARGET = new THREE.Vector3(0, 0.05, 0);

/** Zoom limits for OrbitControls (and UI zoom buttons). */
export const ZOOM_LIMITS = { minDistance: 1.4, maxDistance: 6.5 } as const;

export const CAMERA_PRESETS: Record<CameraPresetId, CameraPreset> = {
  front: {
    id: 'front',
    position: new THREE.Vector3(0, CAMERA_HEIGHT, CAMERA_DISTANCE),
    target: CAMERA_TARGET.clone(),
  },
  back: {
    id: 'back',
    position: new THREE.Vector3(0, CAMERA_HEIGHT, -CAMERA_DISTANCE),
    target: CAMERA_TARGET.clone(),
  },
  left: {
    id: 'left',
    // Garment's left side = +X (viewer perceives it as the shirt's left).
    position: new THREE.Vector3(CAMERA_DISTANCE, CAMERA_HEIGHT, 0),
    target: CAMERA_TARGET.clone(),
  },
  right: {
    id: 'right',
    position: new THREE.Vector3(-CAMERA_DISTANCE, CAMERA_HEIGHT, 0),
    target: CAMERA_TARGET.clone(),
  },
};

export function getCameraPreset(id: CameraPresetId): CameraPreset {
  return CAMERA_PRESETS[id];
}

export function isCameraPresetId(value: unknown): value is CameraPresetId {
  return typeof value === 'string' && value in CAMERA_PRESETS;
}

/**
 * Damped interpolation step used by the camera rig.
 * Returns the next position; `lambda` controls smoothness (higher = snappier).
 */
export function dampedStep(current: THREE.Vector3, goal: THREE.Vector3, lambda: number, dt: number): THREE.Vector3 {
  return current.clone().lerp(goal, 1 - Math.exp(-lambda * dt));
}
