import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  CAMERA_PRESETS,
  ZOOM_LIMITS,
  dampedStep,
  getCameraPreset,
  isCameraPresetId,
} from '../core/camera/cameraPresets';
import { CAMERA_PRESET_IDS } from '../types/preview';
import {
  BUTTON_GEOMETRY,
  COLLAR_GEOMETRY,
  CUFF_GEOMETRY,
  FIT_SCALE,
  POCKET_FLAP_GEOMETRY,
  POCKET_GEOMETRY,
  SLEEVE_GEOMETRY,
} from '../core/model/variations';
import {
  BUTTON_STYLES,
  COLLAR_STYLES,
  CUFF_STYLES,
  FIT_TYPES,
  POCKET_FLAP_STYLES,
  POCKET_STYLES,
  SLEEVE_STYLES,
} from '../types/design';

describe('cameraPresets', () => {
  it('provides exactly front/back/left/right', () => {
    expect([...CAMERA_PRESET_IDS].sort()).toEqual(['back', 'front', 'left', 'right']);
  });

  it('front and back are mirrored on the Z axis', () => {
    expect(getCameraPreset('front').position.z).toBeGreaterThan(0);
    expect(getCameraPreset('back').position.z).toBeLessThan(0);
    expect(getCameraPreset('front').position.z).toBe(-getCameraPreset('back').position.z);
  });

  it('left and right are mirrored on the X axis', () => {
    expect(getCameraPreset('left').position.x).toBe(-getCameraPreset('right').position.x);
  });

  it('all presets sit outside the zoom limits', () => {
    for (const id of CAMERA_PRESET_IDS) {
      const d = CAMERA_PRESETS[id].position.distanceTo(CAMERA_PRESETS[id].target);
      expect(d).toBeGreaterThanOrEqual(ZOOM_LIMITS.minDistance);
      expect(d).toBeLessThanOrEqual(ZOOM_LIMITS.maxDistance);
    }
  });

  it('isCameraPresetId validates strictly', () => {
    expect(isCameraPresetId('front')).toBe(true);
    expect(isCameraPresetId('top')).toBe(false);
    expect(isCameraPresetId(undefined)).toBe(false);
  });

  it('dampedStep converges toward the goal', () => {
    const current = new THREE.Vector3(0, 0, 0);
    const goal = new THREE.Vector3(3, 0, 0);
    const next = dampedStep(current, goal, 6, 1 / 60);
    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThan(3);
    // converges
    let v = current;
    for (let i = 0; i < 600; i += 1) v = dampedStep(v, goal, 6, 1 / 60);
    expect(v.distanceTo(goal)).toBeLessThan(0.001);
  });
});

describe('variation spec consistency (every UI option has real geometry)', () => {
  it('collar styles', () => {
    for (const style of COLLAR_STYLES) expect(COLLAR_GEOMETRY[style]).toBeDefined();
  });
  it('sleeve styles', () => {
    for (const style of SLEEVE_STYLES) expect(SLEEVE_GEOMETRY[style]).toBeDefined();
  });
  it('pocket styles', () => {
    for (const style of POCKET_STYLES) expect(POCKET_GEOMETRY[style]).toBeDefined();
  });
  it('pocket flap styles', () => {
    for (const style of POCKET_FLAP_STYLES) expect(POCKET_FLAP_GEOMETRY[style]).toBeDefined();
  });
  it('cuff styles', () => {
    for (const style of CUFF_STYLES) expect(CUFF_GEOMETRY[style]).toBeDefined();
  });
  it('button styles', () => {
    for (const style of BUTTON_STYLES) expect(BUTTON_GEOMETRY[style]).toBeDefined();
  });
  it('fit types', () => {
    for (const type of FIT_TYPES) expect(FIT_SCALE[type]).toBeDefined();
  });
});
