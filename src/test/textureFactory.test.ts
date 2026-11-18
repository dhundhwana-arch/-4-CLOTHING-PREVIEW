import { describe, expect, it, beforeEach } from 'vitest';
import {
  createPatternTexture,
  disposeTextureCache,
  isGeneratedPatternId,
  paintPatternTile,
  shadeHex,
  textureCacheSize,
  GENERATED_PATTERN_IDS,
} from '../core/materials/textureFactory';

/** Minimal stub of the 2D context surface the painter actually uses. */
function stubContext() {
  const calls: Array<{ fillStyle: unknown; args: number[] }> = [];
  const ctx: Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect'> = {
    fillStyle: '#000000',
    fillRect(...args: number[]) {
      calls.push({ fillStyle: ctx.fillStyle, args });
    },
  };
  return { ctx, calls };
}

describe('textureFactory (generated patterns — NOT photographs)', () => {
  beforeEach(() => disposeTextureCache());

  it('exposes exactly the supported generated patterns', () => {
    expect([...GENERATED_PATTERN_IDS]).toEqual(['weave', 'oxford', 'stripes', 'checks']);
    expect(isGeneratedPatternId('weave')).toBe(true);
    expect(isGeneratedPatternId('paisley')).toBe(false);
  });

  it('paints every pattern without throwing', () => {
    for (const pattern of GENERATED_PATTERN_IDS) {
      const { ctx, calls } = stubContext();
      paintPatternTile(ctx, pattern, '#8899aa', 64);
      expect(calls.length).toBeGreaterThan(0);
    }
  });

  it('returns null (not a crash) when no canvas can be created', () => {
    const result = createPatternTexture('weave', '#aabbcc', { createCanvas: () => null });
    expect(result).toBeNull();
  });

  it('caches textures by pattern+colour+size', () => {
    const a = createPatternTexture('weave', '#aabbcc')!;
    const b = createPatternTexture('weave', '#aabbcc')!;
    const c = createPatternTexture('stripes', '#aabbcc')!;
    expect(a.texture).toBe(b.texture);
    expect(a.texture).not.toBe(c.texture);
    expect(textureCacheSize()).toBe(2);
    disposeTextureCache();
    expect(textureCacheSize()).toBe(0);
  });

  it('shadeHex darkens and lightens deterministically', () => {
    expect(shadeHex('#808080', -0.5)).toBe('#404040');
    expect(shadeHex('#808080', 0)).toBe('#808080');
    expect(shadeHex('#ffffff', 0.5)).toBe('#ffffff'); // clamped
  });
});
