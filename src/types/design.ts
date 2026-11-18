/**
 * MODULE 03 (2d-clothing-designer) integration contract — ILLUSTRATIVE.
 *
 * The verified Module 03 schema does not exist yet (its repository is an
 * empty stub as of 2026-11-18 — see AUDIT_REPORT.md §6). This file therefore
 * defines the *adapter-facing* shape that Module 04 resolves internally.
 * Every field is optional at the boundary; the design adapter validates and
 * applies documented defaults. When Module 03 publishes a real schema, only
 * `src/integration/designAdapter.ts` should need to change.
 */

/** Collar styles with actual 3D geometry in this module. */
export const COLLAR_STYLES = ['classic', 'spread', 'button-down', 'mandarin'] as const;
export type CollarStyle = (typeof COLLAR_STYLES)[number];

/** Sleeve lengths with actual 3D geometry. */
export const SLEEVE_STYLES = ['full', 'half'] as const;
export type SleeveStyle = (typeof SLEEVE_STYLES)[number];

/** Pocket arrangements with actual 3D geometry. */
export const POCKET_STYLES = ['none', 'single', 'double'] as const;
export type PocketStyle = (typeof POCKET_STYLES)[number];

/** Pocket flap variations with actual 3D geometry. */
export const POCKET_FLAP_STYLES = ['none', 'pointed', 'rounded'] as const;
export type PocketFlapStyle = (typeof POCKET_FLAP_STYLES)[number];

/** Cuff styles with actual 3D geometry (rendered for full sleeves only). */
export const CUFF_STYLES = ['standard', 'rounded', 'french'] as const;
export type CuffStyle = (typeof CUFF_STYLES)[number];

/** Button appearances with actual 3D geometry/materials. */
export const BUTTON_STYLES = ['standard', 'pearl', 'dark'] as const;
export type ButtonStyle = (typeof BUTTON_STYLES)[number];

/** Fit types affect silhouette scale only. Approximation, never a fit guarantee. */
export const FIT_TYPES = ['slim', 'regular', 'relaxed'] as const;
export type FitType = (typeof FIT_TYPES)[number];

/**
 * Design configuration as received from (a future) Module 03.
 * All fields optional: the adapter fills defaults and reports what it did.
 */
export interface DesignConfiguration {
  design_id?: string;
  fabric_id?: string;
  collar_style?: string;
  pocket_style?: string;
  pocket_flap_style?: string;
  sleeve_style?: string;
  cuff_style?: string;
  button_style?: string;
  button_color?: string;
  thread_color?: string;
  fit_type?: string;
  /**
   * Escape hatch for forward compatibility: unknown extra keys are preserved
   * and reported as ignored, never silently dropped.
   */
  [extra: string]: unknown;
}

/**
 * Fully validated, defaulted design ready for the preview engine.
 * Produced only by the design adapter — never constructed by hand in app code.
 */
export interface ResolvedDesign {
  designId: string;
  fabricId: string;
  collarStyle: CollarStyle;
  pocketStyle: PocketStyle;
  pocketFlapStyle: PocketFlapStyle;
  sleeveStyle: SleeveStyle;
  cuffStyle: CuffStyle;
  buttonStyle: ButtonStyle;
  /** Normalized `#rrggbb`. */
  buttonColor: string;
  /** Normalized `#rrggbb` stitching/thread colour. */
  threadColor: string;
  fitType: FitType;
}

/** Non-fatal adaptation note: default applied, unsupported option replaced, etc. */
export interface AdaptationNote {
  field: string;
  code: 'default-applied' | 'unsupported-value' | 'invalid-value' | 'unknown-field';
  message: string;
  received?: unknown;
  applied?: unknown;
}

export interface DesignAdapterResult {
  ok: boolean;
  design: ResolvedDesign;
  notes: AdaptationNote[];
}
