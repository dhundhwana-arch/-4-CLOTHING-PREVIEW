/**
 * Stable component identifiers for the procedural shirt model.
 *
 * These IDs are the shared vocabulary between the model builder, the
 * material engine, the design adapter and the test-suite. They must never
 * be renamed silently — Module 01/03 integrations may reference them.
 * See 3D_MODEL_SPECIFICATION.md for the full hierarchy.
 */
export const SHIRT_COMPONENT_IDS = [
  'shirt/body',
  'shirt/sleeve-left',
  'shirt/sleeve-right',
  'shirt/collar',
  'shirt/collar-band',
  'shirt/collar-leaf-left',
  'shirt/collar-leaf-right',
  'shirt/collar-button-left',
  'shirt/collar-button-right',
  'shirt/button-panel',
  'shirt/buttons',
  'shirt/cuff-left',
  'shirt/cuff-right',
  'shirt/pocket-left',
  'shirt/pocket-right',
  'shirt/pocket-flap-left',
  'shirt/pocket-flap-right',
  'shirt/stitching',
] as const;

export type ShirtComponentId = (typeof SHIRT_COMPONENT_IDS)[number];

/** Top-level group name of the assembled model. */
export const SHIRT_ROOT_NAME = 'shirt-root';

/** Material slots — the material engine produces one material per slot. */
export const MATERIAL_SLOT_IDS = [
  // Extruded geometry (body, pockets, flaps, collar leaves) uses shape-space
  // UVs, so it gets a dedicated texture-repeat calibration.
  'cloth-extruded',
  // Cylinders / boxes (sleeves, cuffs, collar band, placket) use standard UVs.
  'cloth-standard',
  'button',
  'thread',
] as const;

export type MaterialSlotId = (typeof MATERIAL_SLOT_IDS)[number];

/** Which material slot each component uses. */
export const COMPONENT_MATERIAL_SLOT: Record<ShirtComponentId, MaterialSlotId> = {
  'shirt/body': 'cloth-extruded',
  'shirt/sleeve-left': 'cloth-standard',
  'shirt/sleeve-right': 'cloth-standard',
  'shirt/collar': 'cloth-standard',
  'shirt/collar-band': 'cloth-standard',
  'shirt/collar-leaf-left': 'cloth-extruded',
  'shirt/collar-leaf-right': 'cloth-extruded',
  'shirt/collar-button-left': 'button',
  'shirt/collar-button-right': 'button',
  'shirt/button-panel': 'cloth-standard',
  'shirt/buttons': 'button',
  'shirt/cuff-left': 'cloth-standard',
  'shirt/cuff-right': 'cloth-standard',
  'shirt/pocket-left': 'cloth-extruded',
  'shirt/pocket-right': 'cloth-extruded',
  'shirt/pocket-flap-left': 'cloth-extruded',
  'shirt/pocket-flap-right': 'cloth-extruded',
  'shirt/stitching': 'thread',
};
