import * as THREE from 'three';
import { MATERIAL_SLOT_IDS, type MaterialSlotId } from '../model/components';
import { BUTTON_GEOMETRY } from '../model/variations';
import { createPatternTexture, isGeneratedPatternId } from './textureFactory';
import type { ResolvedDesign } from '../../types/design';
import type { ResolvedFabric } from '../../types/fabric';

/**
 * Material engine: one THREE.MeshStandardMaterial per material slot
 * (see components.ts). Materials are shared across every mesh in the slot
 * (no per-mesh clones → low GPU program/texture pressure on mobile).
 *
 * Texture policy: generated weave/pattern tiles only (never fabricated
 * photography — see MATERIAL_SYSTEM.md). Any texture failure degrades to
 * flat base colour and is reported in `warnings`.
 */

export interface MaterialSet {
  materials: Record<MaterialSlotId, THREE.MeshStandardMaterial>;
  warnings: string[];
  /** True when a fabric texture is actually bound to cloth slots. */
  textureApplied: boolean;
}

/** UV repeat calibration per slot (extrude UVs are in shape-space units). */
const SLOT_TEXTURE_REPEAT: Record<MaterialSlotId, { x: number; y: number }> = {
  'cloth-extruded': { x: 0.55, y: 0.55 },
  'cloth-standard': { x: 2, y: 2 },
  button: { x: 1, y: 1 },
  thread: { x: 1, y: 1 },
};

export interface MaterialEngineOptions {
  /** Override pattern resolution (defaults to fabric.textureRef). */
  patternOverride?: string;
  /** Disable texture generation entirely (e.g. low-power mode). */
  disableTextures?: boolean;
  /** Test hook forwarded to the texture factory. */
  createCanvas?: (size: number) => HTMLCanvasElement | null;
}

export function createMaterialSet(
  design: ResolvedDesign,
  fabric: ResolvedFabric,
  options: MaterialEngineOptions = {},
): MaterialSet {
  const warnings: string[] = [];
  const baseColor = new THREE.Color(fabric.record.baseColorHex);
  const buttonSpec = BUTTON_GEOMETRY[design.buttonStyle];
  const buttonColor = new THREE.Color(design.buttonColor || buttonSpec.defaultColor);
  const threadColor = new THREE.Color(design.threadColor);

  let clothMap: THREE.CanvasTexture | null = null;
  const patternKey = options.patternOverride ?? fabric.record.textureRef;

  if (!options.disableTextures && patternKey) {
    if (isGeneratedPatternId(patternKey)) {
      const generated = createPatternTexture(patternKey, fabric.record.baseColorHex, {
        createCanvas: options.createCanvas,
      });
      if (generated && !generated.degraded) {
        clothMap = generated.texture;
      } else {
        warnings.push(
          `Texture generation degraded for pattern "${patternKey}" — flat colour fallback applied.`,
        );
      }
    } else {
      warnings.push(
        `Fabric texture reference "${patternKey}" is not a supported generated pattern. ` +
          'External fabric photography requires the verified Module 02 asset pipeline (pending). ' +
          'Flat colour fallback applied.',
      );
    }
  }

  const makeCloth = (slot: 'cloth-extruded' | 'cloth-standard'): THREE.MeshStandardMaterial => {
    const material = new THREE.MeshStandardMaterial({
      color: baseColor.clone(),
      roughness: 0.88,
      metalness: 0.0,
    });
    if (clothMap) {
      const repeat = SLOT_TEXTURE_REPEAT[slot];
      // One texture instance per slot-repeat so repeat calibration stays independent.
      const map = slot === 'cloth-extruded' ? clothMap : clothMap.clone();
      map.repeat.set(repeat.x, repeat.y);
      map.needsUpdate = true;
      material.map = map;
    }
    return material;
  };

  const materials: Record<MaterialSlotId, THREE.MeshStandardMaterial> = {
    'cloth-extruded': makeCloth('cloth-extruded'),
    'cloth-standard': makeCloth('cloth-standard'),
    button: new THREE.MeshStandardMaterial({
      color: buttonColor,
      roughness: buttonSpec.roughness,
      metalness: 0.05,
    }),
    thread: new THREE.MeshStandardMaterial({
      color: threadColor,
      roughness: 0.7,
      metalness: 0.0,
    }),
  };

  return {
    materials,
    warnings,
    textureApplied: clothMap !== null,
  };
}

/** Assign a material set onto a built model, using each mesh's recorded slot. */
export function applyMaterialSet(root: THREE.Object3D, set: MaterialSet): number {
  let assigned = 0;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const slot = obj.userData.materialSlot as MaterialSlotId | undefined;
      if (slot && MATERIAL_SLOT_IDS.includes(slot)) {
        obj.material = set.materials[slot];
        assigned += 1;
      }
    }
  });
  return assigned;
}

export function disposeMaterialSet(set: MaterialSet): void {
  for (const slot of MATERIAL_SLOT_IDS) {
    const material = set.materials[slot];
    material.map?.dispose();
    material.dispose();
  }
}
