import {
  BUTTON_STYLES,
  COLLAR_STYLES,
  CUFF_STYLES,
  FIT_TYPES,
  POCKET_FLAP_STYLES,
  POCKET_STYLES,
  SLEEVE_STYLES,
  type AdaptationNote,
  type ButtonStyle,
  type CollarStyle,
  type CuffStyle,
  type DesignAdapterResult,
  type DesignConfiguration,
  type FitType,
  type PocketFlapStyle,
  type PocketStyle,
  type ResolvedDesign,
  type SleeveStyle,
} from '../types/design';
import { isSupportedOption, normalizeHexColor } from '../core/validation/validators';
import { CUFF_GEOMETRY, SLEEVE_GEOMETRY } from '../core/model/variations';

/**
 * MODULE 03 ADAPTER — isolated boundary between the (future) 2D designer
 * output and the 3D preview engine.
 *
 * The verified Module 03 schema does not exist yet (AUDIT_REPORT.md §6), so
 * this adapter accepts the *illustrative* field names from the project brief
 * and resolves them into a fully validated `ResolvedDesign`:
 *
 *  - missing fields        → documented defaults + 'default-applied' note
 *  - unsupported values    → fallback default + 'unsupported-value' note
 *                            (the preview NEVER silently renders a different
 *                            style without recording it)
 *  - invalid colour values → 'invalid-value' note + default
 *  - unknown extra fields  → 'unknown-field' note, value ignored
 *  - cuff style + half sleeves → cuffs not rendered; note recorded
 *
 * When Module 03 publishes its real contract, replace ONLY this file.
 */

/** Documented defaults (INTEGRATION.md §Defaults). */
export const DESIGN_DEFAULTS = {
  designId: 'unsigned-design',
  fabricId: 'fixture-cotton-white',
  collarStyle: 'classic' as CollarStyle,
  pocketStyle: 'single' as PocketStyle,
  pocketFlapStyle: 'none' as PocketFlapStyle,
  sleeveStyle: 'full' as SleeveStyle,
  cuffStyle: 'standard' as CuffStyle,
  buttonStyle: 'standard' as ButtonStyle,
  buttonColor: '',
  threadColor: '#d8d8d8',
  fitType: 'regular' as FitType,
};

const KNOWN_FIELDS = new Set([
  'design_id',
  'fabric_id',
  'collar_style',
  'pocket_style',
  'pocket_flap_style',
  'sleeve_style',
  'cuff_style',
  'button_style',
  'button_color',
  'thread_color',
  'fit_type',
  // Accepted-but-ignored illustrative fields from the brief:
  'button_id',
  'thread_id',
]);

function resolveOption<T extends string>(
  value: unknown,
  supported: readonly T[],
  fallback: T,
  field: string,
  notes: AdaptationNote[],
): T {
  if (value === undefined || value === null || value === '') {
    notes.push({ field, code: 'default-applied', message: `No ${field} provided; default "${fallback}" applied.`, applied: fallback });
    return fallback;
  }
  if (isSupportedOption(value, supported)) return value;
  notes.push({
    field,
    code: 'unsupported-value',
    message: `Unsupported ${field} "${String(value)}". Fallback "${fallback}" rendered — this is an explicit fallback, not a silent substitution.`,
    received: value,
    applied: fallback,
  });
  return fallback;
}

function resolveColor(
  value: unknown,
  fallback: string,
  field: string,
  notes: AdaptationNote[],
  allowEmpty: boolean,
): string {
  if (value === undefined || value === null || value === '') {
    if (allowEmpty) return '';
    notes.push({ field, code: 'default-applied', message: `No ${field} provided; default ${fallback} applied.`, applied: fallback });
    return fallback;
  }
  const normalized = normalizeHexColor(value);
  if (normalized) return normalized;
  notes.push({
    field,
    code: 'invalid-value',
    message: `Invalid ${field} "${String(value)}" (expected #rgb/#rrggbb). Default ${fallback} applied.`,
    received: value,
    applied: fallback,
  });
  return fallback;
}

/**
 * Validate + normalize any unknown input into a ResolvedDesign.
 * Total function: never throws; problems are reported in `notes`.
 */
export function adaptDesignConfiguration(input: unknown): DesignAdapterResult {
  const notes: AdaptationNote[] = [];
  const source: DesignConfiguration =
    input !== null && typeof input === 'object' ? (input as DesignConfiguration) : {};

  if (input !== undefined && (input === null || typeof input !== 'object')) {
    notes.push({
      field: '(root)',
      code: 'invalid-value',
      message: 'Design configuration must be an object; full defaults applied.',
      received: input,
    });
  }

  for (const key of Object.keys(source)) {
    if (!KNOWN_FIELDS.has(key)) {
      notes.push({
        field: key,
        code: 'unknown-field',
        message: `Unknown field "${key}" ignored (not part of the illustrative Module 03 contract).`,
        received: source[key],
      });
    }
  }

  const sleeveStyle = resolveOption<SleeveStyle>(source.sleeve_style, SLEEVE_STYLES, DESIGN_DEFAULTS.sleeveStyle, 'sleeve_style', notes);
  let cuffStyle = resolveOption<CuffStyle>(source.cuff_style, CUFF_STYLES, DESIGN_DEFAULTS.cuffStyle, 'cuff_style', notes);

  if (!SLEEVE_GEOMETRY[sleeveStyle].supportsCuffs && source.cuff_style !== undefined && source.cuff_style !== '') {
    notes.push({
      field: 'cuff_style',
      code: 'unsupported-value',
      message: `Sleeve style "${sleeveStyle}" has no cuff geometry (supportsCuffs=false); cuff "${cuffStyle}" will not be rendered.`,
      received: source.cuff_style,
    });
    // Keep the value (it is still *valid*) but rendering omits cuffs.
    void CUFF_GEOMETRY[cuffStyle];
  }

  const design: ResolvedDesign = {
    designId: typeof source.design_id === 'string' && source.design_id !== '' ? source.design_id : DESIGN_DEFAULTS.designId,
    fabricId: typeof source.fabric_id === 'string' && source.fabric_id !== '' ? source.fabric_id : DESIGN_DEFAULTS.fabricId,
    collarStyle: resolveOption<CollarStyle>(source.collar_style, COLLAR_STYLES, DESIGN_DEFAULTS.collarStyle, 'collar_style', notes),
    pocketStyle: resolveOption<PocketStyle>(source.pocket_style, POCKET_STYLES, DESIGN_DEFAULTS.pocketStyle, 'pocket_style', notes),
    pocketFlapStyle: resolveOption<PocketFlapStyle>(source.pocket_flap_style, POCKET_FLAP_STYLES, DESIGN_DEFAULTS.pocketFlapStyle, 'pocket_flap_style', notes),
    sleeveStyle,
    cuffStyle,
    buttonStyle: resolveOption<ButtonStyle>(source.button_style, BUTTON_STYLES, DESIGN_DEFAULTS.buttonStyle, 'button_style', notes),
    buttonColor: resolveColor(source.button_color, '', 'button_color', notes, true),
    threadColor: resolveColor(source.thread_color, DESIGN_DEFAULTS.threadColor, 'thread_color', notes, false),
    fitType: resolveOption<FitType>(source.fit_type, FIT_TYPES, DESIGN_DEFAULTS.fitType, 'fit_type', notes),
  };

  return { ok: true, design, notes };
}
