import type { DesignConfiguration } from './design';
import type { FabricReference } from './fabric';

/** Camera preset identifiers exposed by the preview engine. */
export const CAMERA_PRESET_IDS = ['front', 'back', 'left', 'right'] as const;
export type CameraPresetId = (typeof CAMERA_PRESET_IDS)[number];

/** Structured error surfaced to hosts through `onError`. */
export interface PreviewError {
  code:
    | 'webgl-unavailable'
    | 'render-failure'
    | 'design-invalid'
    | 'fabric-unavailable'
    | 'fabric-not-found'
    | 'texture-load-failed'
    | 'unknown';
  message: string;
  cause?: unknown;
}

/** Information passed to `onLoad` once the scene is ready. */
export interface PreviewLoadInfo {
  webgl2: boolean;
  componentCount: number;
  designId: string;
  fabricId: string;
}

/** Change notification emitted when the *user* changes the configuration. */
export interface ConfigurationChange {
  design: DesignConfiguration;
  changedField: string;
  value: unknown;
}

/**
 * Public props of `<Shirt3DPreview />` — the Module 01 integration surface.
 * See INTEGRATION.md for the full contract.
 */
export interface Shirt3DPreviewProps {
  /** Module 03 design configuration (illustrative contract). */
  design?: DesignConfiguration;
  /** Module 02 fabric: id (resolved via `fabricSource`) or full record. */
  fabric?: FabricReference;
  /** Replaceable Module 02 boundary. Defaults to labelled local fixtures. */
  fabricSource?: import('./fabric').FabricSource;
  onConfigurationChange?: (change: ConfigurationChange) => void;
  onLoad?: (info: PreviewLoadInfo) => void;
  onError?: (error: PreviewError) => void;
  initialCameraPreset?: CameraPresetId;
  /** Show the design-details side panel. Default true. */
  showDesignDetails?: boolean;
  /** Enable built-in FPS sampling (perf diagnostics). Default false. */
  enablePerfSampling?: boolean;
  onPerformanceSample?: (sample: PerformanceSample) => void;
  className?: string;
}

export interface PerformanceSample {
  /** Exponentially-smoothed frames per second. */
  fps: number;
  /** Milliseconds of the last rendered frame. */
  frameMs: number;
  timestamp: number;
}
