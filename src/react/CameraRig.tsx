import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  CAMERA_PRESETS,
  ZOOM_LIMITS,
  dampedStep,
} from '../core/camera/cameraPresets';
import type { CameraPresetId } from '../types/preview';

/** Imperative camera request issued by the control bar. */
export interface CameraCommand {
  type: 'preset' | 'reset' | 'zoom-in' | 'zoom-out';
  preset?: CameraPresetId;
  /** Monotonic counter so repeated identical commands still retrigger. */
  nonce: number;
}

export interface CameraRigProps {
  command: CameraCommand | null;
}

const ZOOM_STEP = 0.78; // multiplicative per click
const DAMP_LAMBDA = 6;
const SNAP_DISTANCE = 0.012;

/**
 * OrbitControls wrapper with damped preset transitions and clamped zoom.
 * User interaction (pointer down) cancels any in-flight preset animation so
 * the camera never fights the user.
 */
export function CameraRig({ command }: CameraRigProps) {
  const camera = useThree((s) => s.camera);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const goalPosition = useRef<THREE.Vector3 | null>(null);
  const goalTarget = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (!command) return;
    const controls = controlsRef.current;
    const target = controls ? controls.target : CAMERA_PRESETS.front.target;

    if (command.type === 'preset' && command.preset) {
      const preset = CAMERA_PRESETS[command.preset];
      goalPosition.current = preset.position.clone();
      goalTarget.current = preset.target.clone();
    } else if (command.type === 'reset') {
      goalPosition.current = CAMERA_PRESETS.front.position.clone();
      goalTarget.current = CAMERA_PRESETS.front.target.clone();
    } else {
      const direction = camera.position.clone().sub(target);
      const distance = direction.length();
      const factor = command.type === 'zoom-in' ? ZOOM_STEP : 1 / ZOOM_STEP;
      const next = THREE.MathUtils.clamp(distance * factor, ZOOM_LIMITS.minDistance, ZOOM_LIMITS.maxDistance);
      goalPosition.current = target.clone().add(direction.normalize().multiplyScalar(next));
      goalTarget.current = target.clone();
    }
  }, [command, camera]);

  useFrame((_, delta) => {
    if (!goalPosition.current) return;
    const dt = Math.min(delta, 0.1); // clamp tab-switch spikes
    camera.position.copy(dampedStep(camera.position, goalPosition.current, DAMP_LAMBDA, dt));
    const controls = controlsRef.current;
    if (controls && goalTarget.current) {
      controls.target.copy(dampedStep(controls.target, goalTarget.current, DAMP_LAMBDA, dt));
      controls.update();
    }
    if (camera.position.distanceTo(goalPosition.current) < SNAP_DISTANCE) {
      camera.position.copy(goalPosition.current);
      goalPosition.current = null;
      goalTarget.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={ZOOM_LIMITS.minDistance}
      maxDistance={ZOOM_LIMITS.maxDistance}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI - 0.35}
      target={[0, 0.05, 0]}
      onStart={() => {
        goalPosition.current = null;
        goalTarget.current = null;
      }}
    />
  );
}
