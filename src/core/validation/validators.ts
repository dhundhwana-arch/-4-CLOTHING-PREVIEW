/**
 * Configuration validation utilities. Pure functions — no DOM, no three.js.
 */

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value.trim());
}

/** Normalize #rgb → #rrggbb, lowercase. Returns null when invalid. */
export function normalizeHexColor(value: unknown): string | null {
  if (!isValidHexColor(value)) return null;
  let hex = value.trim().toLowerCase();
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

/** Validate a string against a list of supported option ids. */
export function isSupportedOption<T extends string>(value: unknown, supported: readonly T[]): value is T {
  return typeof value === 'string' && (supported as readonly string[]).includes(value);
}
