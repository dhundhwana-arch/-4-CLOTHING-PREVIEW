import type {
  ButtonStyle,
  CollarStyle,
  CuffStyle,
  FitType,
  PocketFlapStyle,
  PocketStyle,
  SleeveStyle,
} from '../../types/design';

/**
 * Declarative description of every supported design variation and the
 * geometry parameters that realize it. This is the single source of truth
 * for "which options have an actual 3D representation" — UI options outside
 * these lists are rejected by the design adapter (never silently swapped).
 */

export interface CollarGeometrySpec {
  /** Collar band height in model units. */
  bandHeight: number;
  /** Whether leaf flaps exist. */
  hasLeaves: boolean;
  /** Leaf tip horizontal offset from centre front. */
  leafTipX: number;
  /** Leaf tip vertical offset below the neck line. */
  leafTipY: number;
  /** Whether small buttons are rendered at the leaf tips. */
  hasTipButtons: boolean;
}

export const COLLAR_GEOMETRY: Record<CollarStyle, CollarGeometrySpec> = {
  classic: { bandHeight: 0.14, hasLeaves: true, leafTipX: 0.3, leafTipY: -0.34, hasTipButtons: false },
  spread: { bandHeight: 0.14, hasLeaves: true, leafTipX: 0.38, leafTipY: -0.26, hasTipButtons: false },
  'button-down': { bandHeight: 0.13, hasLeaves: true, leafTipX: 0.28, leafTipY: -0.32, hasTipButtons: true },
  mandarin: { bandHeight: 0.12, hasLeaves: false, leafTipX: 0, leafTipY: 0, hasTipButtons: false },
};

export interface SleeveGeometrySpec {
  /** Sleeve end point (x magnitude, y) in model space; mirrored for the left side. */
  endX: number;
  endY: number;
  radiusTop: number;
  radiusBottom: number;
  /** Cuffs are only rendered for full sleeves. */
  supportsCuffs: boolean;
}

export const SLEEVE_GEOMETRY: Record<SleeveStyle, SleeveGeometrySpec> = {
  full: { endX: 1.06, endY: 0.02, radiusTop: 0.21, radiusBottom: 0.15, supportsCuffs: true },
  half: { endX: 0.98, endY: 0.55, radiusTop: 0.22, radiusBottom: 0.2, supportsCuffs: false },
};

export interface PocketGeometrySpec {
  left: boolean;
  right: boolean;
}

export const POCKET_GEOMETRY: Record<PocketStyle, PocketGeometrySpec> = {
  none: { left: false, right: false },
  single: { left: true, right: false },
  double: { left: true, right: true },
};

export interface PocketFlapGeometrySpec {
  hasFlap: boolean;
  /** 'pointed' produces a pentagon outline; 'rounded' a rounded rectangle. */
  outline: 'pointed' | 'rounded' | null;
}

export const POCKET_FLAP_GEOMETRY: Record<PocketFlapStyle, PocketFlapGeometrySpec> = {
  none: { hasFlap: false, outline: null },
  pointed: { hasFlap: true, outline: 'pointed' },
  rounded: { hasFlap: true, outline: 'rounded' },
};

export interface CuffGeometrySpec {
  height: number;
  radius: number;
  /** French cuffs render a second fold ring. */
  hasFoldRing: boolean;
}

export const CUFF_GEOMETRY: Record<CuffStyle, CuffGeometrySpec> = {
  standard: { height: 0.16, radius: 0.16, hasFoldRing: false },
  rounded: { height: 0.14, radius: 0.155, hasFoldRing: false },
  french: { height: 0.24, radius: 0.165, hasFoldRing: true },
};

export interface ButtonGeometrySpec {
  radius: number;
  thickness: number;
  /** Default tint per style; overridden by design.buttonColor when given. */
  defaultColor: string;
  roughness: number;
}

export const BUTTON_GEOMETRY: Record<ButtonStyle, ButtonGeometrySpec> = {
  standard: { radius: 0.035, thickness: 0.02, defaultColor: '#f4f1e8', roughness: 0.55 },
  pearl: { radius: 0.034, thickness: 0.018, defaultColor: '#f8f6f0', roughness: 0.18 },
  dark: { radius: 0.035, thickness: 0.02, defaultColor: '#2c2c30', roughness: 0.4 },
};

/** Silhouette scale factors per fit. Visual approximation only — never a fit promise. */
export const FIT_SCALE: Record<FitType, { x: number; z: number }> = {
  slim: { x: 0.94, z: 0.92 },
  regular: { x: 1, z: 1 },
  relaxed: { x: 1.08, z: 1.1 },
};

/** Front-placket button count. */
export const FRONT_BUTTON_COUNT = 7;

/** Number of radial segments used by curved geometry (kept low for mobile GPUs). */
export const RADIAL_SEGMENTS = 20;
