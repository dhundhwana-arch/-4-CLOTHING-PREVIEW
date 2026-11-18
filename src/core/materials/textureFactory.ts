import * as THREE from 'three';

/**
 * Procedural fabric texture factory.
 *
 * IMPORTANT (honesty / licensing): these are CANVAS-GENERATED weave and
 * pattern approximations. They are NOT photographs of real fabrics and are
 * never presented as such (see MATERIAL_SYSTEM.md). When Module 02 ships
 * verified fabric photography, the texture pipeline below is replaced by
 * `TextureLoader` with the same fallback contract — loading failures always
 * degrade to flat colour, never crash the preview.
 *
 * All generated textures are cached by key and must be disposed through
 * `disposeTextureCache()`.
 */

export const GENERATED_PATTERN_IDS = ['weave', 'oxford', 'stripes', 'checks'] as const;
export type GeneratedPatternId = (typeof GENERATED_PATTERN_IDS)[number];

export function isGeneratedPatternId(value: string): value is GeneratedPatternId {
  return (GENERATED_PATTERN_IDS as readonly string[]).includes(value);
}

export interface TextureFactoryOptions {
  /** Tile size in px (square). Default 128 — deliberately small for mobile. */
  size?: number;
  /** Injected for tests / non-DOM environments. Defaults to document.createElement. */
  createCanvas?: (size: number) => HTMLCanvasElement | null;
}

export interface GeneratedTexture {
  texture: THREE.CanvasTexture;
  pattern: GeneratedPatternId;
  /** True when the canvas 2D context was unavailable and `texture` wraps a blank canvas. */
  degraded: boolean;
}

const cache = new Map<string, THREE.CanvasTexture>();

function defaultCreateCanvas(size: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

/** Deterministic tint helper: darken/lighten a #rrggbb colour by [-1..1]. */
export function shadeHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 0xff) * (1 + amount));
  const g = clamp(((n >> 8) & 0xff) * (1 + amount));
  const b = clamp((n & 0xff) * (1 + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Draw one pattern tile. Exported for direct unit testing with a stub 2D context. */
export function paintPatternTile(
  ctx: Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect'>,
  pattern: GeneratedPatternId,
  baseColorHex: string,
  size: number,
): void {
  const dark = shadeHex(baseColorHex, -0.12);
  const light = shadeHex(baseColorHex, 0.1);

  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, size, size);

  switch (pattern) {
    case 'weave': {
      // Fine 2px plain-weave alternation.
      const step = Math.max(2, Math.floor(size / 64));
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          ctx.fillStyle = (x / step + y / step) % 2 === 0 ? dark : baseColorHex;
          ctx.fillRect(x, y, step, step);
        }
      }
      break;
    }
    case 'oxford': {
      // 2x2 basket weave blocks.
      const block = Math.max(2, Math.floor(size / 32));
      for (let y = 0; y < size; y += block) {
        for (let x = 0; x < size; x += block) {
          const bx = Math.floor(x / block);
          const by = Math.floor(y / block);
          ctx.fillStyle = (Math.floor(bx / 2) + Math.floor(by / 2)) % 2 === 0 ? light : dark;
          ctx.fillRect(x, y, block, block);
        }
      }
      break;
    }
    case 'stripes': {
      const stripe = Math.max(4, Math.floor(size / 8));
      for (let x = 0; x < size; x += stripe * 2) {
        ctx.fillStyle = light;
        ctx.fillRect(x, 0, stripe, size);
      }
      break;
    }
    case 'checks': {
      const cell = Math.max(4, Math.floor(size / 8));
      for (let y = 0; y < size; y += cell) {
        for (let x = 0; x < size; x += cell) {
          const cx = Math.floor(x / cell);
          const cy = Math.floor(y / cell);
          if ((cx + cy) % 2 === 0) {
            ctx.fillStyle = dark;
            ctx.fillRect(x, y, cell, cell);
          }
        }
      }
      // Sheer cross-lines to suggest a gingham overlap.
      ctx.fillStyle = light;
      for (let x = 0; x < size; x += cell * 2) ctx.fillRect(x, 0, Math.max(1, cell / 4), size);
      for (let y = 0; y < size; y += cell * 2) ctx.fillRect(0, y, size, Math.max(1, cell / 4));
      break;
    }
  }
}

/**
 * Create (or fetch from cache) a generated pattern texture.
 * Returns null only when no canvas can be created at all (non-DOM env);
 * callers must then fall back to flat colour.
 */
export function createPatternTexture(
  pattern: GeneratedPatternId,
  baseColorHex: string,
  options: TextureFactoryOptions = {},
): GeneratedTexture | null {
  const size = options.size ?? 128;
  const cacheKey = `${pattern}:${baseColorHex}:${size}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return { texture: cached, pattern, degraded: false };
  }

  const create = options.createCanvas ?? defaultCreateCanvas;
  const canvas = create(size);
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  let degraded = false;
  if (ctx) {
    paintPatternTile(ctx, pattern, baseColorHex, size);
  } else {
    degraded = true;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(cacheKey, texture);
  return { texture, pattern, degraded };
}

export function disposeTextureCache(): void {
  for (const texture of cache.values()) {
    texture.dispose();
  }
  cache.clear();
}

/** Test/introspection helper: how many textures are currently cached. */
export function textureCacheSize(): number {
  return cache.size;
}
