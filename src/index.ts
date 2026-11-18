/**
 * MODULE 04 — 3D CLOTHING PREVIEW · public library surface.
 *
 * Module 01 (custom-shirt-studio) integrates through this file only.
 * See INTEGRATION.md and NEXT_MODULE_HANDOFF.md.
 */

// Main component
export { Shirt3DPreview } from './react/Shirt3DPreview';
export { WebGLFallback } from './react/WebGLFallback';
export { DesignDetailsPanel } from './react/DesignDetailsPanel';

// Contracts (types)
export type {
  DesignConfiguration,
  ResolvedDesign,
  AdaptationNote,
  DesignAdapterResult,
  CollarStyle,
  SleeveStyle,
  PocketStyle,
  PocketFlapStyle,
  CuffStyle,
  ButtonStyle,
  FitType,
} from './types/design';
export {
  COLLAR_STYLES,
  SLEEVE_STYLES,
  POCKET_STYLES,
  POCKET_FLAP_STYLES,
  CUFF_STYLES,
  BUTTON_STYLES,
  FIT_TYPES,
} from './types/design';
export type {
  FabricRecord,
  FabricReference,
  FabricSource,
  FabricResolution,
  ResolvedFabric,
} from './types/fabric';
export type {
  Shirt3DPreviewProps,
  CameraPresetId,
  PreviewError,
  PreviewLoadInfo,
  PerformanceSample,
  ConfigurationChange,
} from './types/preview';
export { CAMERA_PRESET_IDS } from './types/preview';

// Adapters (for hosts that want to pre-validate or build custom flows)
export { adaptDesignConfiguration, DESIGN_DEFAULTS } from './integration/designAdapter';
export { createFabricAdapter, FABRIC_FALLBACK_COLOR, type FabricAdapter } from './integration/fabricAdapter';

// Supported-option metadata (so hosts never render an unsupported UI option)
export {
  COLLAR_GEOMETRY,
  SLEEVE_GEOMETRY,
  POCKET_GEOMETRY,
  POCKET_FLAP_GEOMETRY,
  CUFF_GEOMETRY,
  BUTTON_GEOMETRY,
  FIT_SCALE,
} from './core/model/variations';
export { SHIRT_COMPONENT_IDS, MATERIAL_SLOT_IDS } from './core/model/components';

// Utilities hosts may need
export { detectWebGLSupport, type WebGLSupport } from './core/webgl/detectWebGL';
export { CAMERA_PRESETS, ZOOM_LIMITS } from './core/camera/cameraPresets';
export { GENERATED_PATTERN_IDS } from './core/materials/textureFactory';
