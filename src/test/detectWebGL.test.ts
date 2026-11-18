import { describe, expect, it } from 'vitest';
import { detectWebGLSupport } from '../core/webgl/detectWebGL';

describe('detectWebGLSupport (graceful degradation)', () => {
  it('reports unsupported in jsdom (no WebGL contexts)', () => {
    const support = detectWebGLSupport();
    expect(support.supported).toBe(false);
    expect(support.reason).toBeTruthy();
  });

  it('reports unsupported when canvas creation is impossible', () => {
    const support = detectWebGLSupport(() => null);
    expect(support.supported).toBe(false);
  });

  it('reports supported + webgl2 when webgl2 context exists', () => {
    const fake = {
      getContext: (kind: string) => (kind === 'webgl2' ? ({} as WebGL2RenderingContext) : null),
    } as HTMLCanvasElement;
    const support = detectWebGLSupport(() => fake);
    expect(support.supported).toBe(true);
    expect(support.webgl2).toBe(true);
  });

  it('falls back to webgl1 when webgl2 is missing', () => {
    const fake = {
      getContext: (kind: string) => (kind === 'webgl' ? ({} as WebGLRenderingContext) : null),
    } as HTMLCanvasElement;
    const support = detectWebGLSupport(() => fake);
    expect(support.supported).toBe(true);
    expect(support.webgl2).toBe(false);
  });

  it('never throws when getContext throws', () => {
    const fake = {
      getContext: () => {
        throw new Error('driver blocked');
      },
    } as unknown as HTMLCanvasElement;
    const support = detectWebGLSupport(() => fake);
    expect(support.supported).toBe(false);
    expect(support.reason).toContain('threw');
  });
});
