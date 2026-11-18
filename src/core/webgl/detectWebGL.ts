/**
 * WebGL capability detection (Phase 10 — graceful degradation).
 *
 * Returns a structured result instead of throwing so hosts can render a
 * proper fallback. jsdom (test env) has no WebGL, which makes the
 * unsupported-path directly unit-testable.
 */

export interface WebGLSupport {
  supported: boolean;
  webgl2: boolean;
  /** Human-readable reason when unsupported. */
  reason?: string;
}

export function detectWebGLSupport(
  createCanvas?: () => HTMLCanvasElement | null,
): WebGLSupport {
  const makeCanvas =
    createCanvas ??
    (() => (typeof document === 'undefined' ? null : document.createElement('canvas')));

  let canvas: HTMLCanvasElement | null = null;
  try {
    canvas = makeCanvas();
  } catch (cause) {
    return { supported: false, webgl2: false, reason: `Canvas creation threw: ${String(cause)}` };
  }
  if (!canvas) {
    return { supported: false, webgl2: false, reason: 'Canvas element unavailable (non-DOM environment).' };
  }

  try {
    if (canvas.getContext('webgl2')) {
      return { supported: true, webgl2: true };
    }
    if (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) {
      return { supported: true, webgl2: false };
    }
  } catch (cause) {
    return { supported: false, webgl2: false, reason: `WebGL context request threw: ${String(cause)}` };
  }

  return {
    supported: false,
    webgl2: false,
    reason: 'WebGL context could not be created (disabled, blocked, or unsupported hardware).',
  };
}
