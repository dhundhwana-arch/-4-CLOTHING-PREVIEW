import { describe, expect, it } from 'vitest';
import { createFabricAdapter, FABRIC_FALLBACK_COLOR } from '../integration/fabricAdapter';
import { FIXTURE_FABRICS, LocalFixtureFabricSource } from '../integration/fixtures/fabricFixtures';
import type { FabricSource } from '../types/fabric';

describe('fabricAdapter (Module 02 boundary)', () => {
  const source = new LocalFixtureFabricSource();
  const adapter = createFabricAdapter(source);

  it('resolves a fixture fabric by id (labelled as fixture data)', async () => {
    const result = await adapter.resolve({ fabricId: 'fixture-cotton-white' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fabric.record.fabricId).toBe('fixture-cotton-white');
      expect(result.fabric.fromFixture).toBe(true);
    }
  });

  it('resolves an inline fabric record without lookup', async () => {
    const result = await adapter.resolve({
      fabricId: 'inline-1',
      displayName: 'Inline',
      fabricType: 'cotton',
      baseColorHex: '#ABC',
      available: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fabric.record.baseColorHex).toBe('#aabbcc'); // normalized
    }
  });

  it('fails cleanly for unknown fabric ids (never invents inventory)', async () => {
    const result = await adapter.resolve({ fabricId: 'no-such-fabric' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fabricId).toBe('no-such-fabric');
      expect(result.error).toContain('no-such-fabric');
    }
  });

  it('falls back to neutral grey for invalid fabric colours', async () => {
    const result = await adapter.resolve({
      fabricId: 'bad-color',
      displayName: 'Bad',
      fabricType: 'cotton',
      baseColorHex: 'not-a-color',
      available: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fabric.record.baseColorHex).toBe(FABRIC_FALLBACK_COLOR);
      expect(result.fabric.notes.join(' ')).toContain('invalid baseColorHex');
    }
  });

  it('notes missing texture references (flat colour fallback)', async () => {
    const result = await adapter.resolve({
      fabricId: 'no-texture',
      displayName: 'Plain',
      fabricType: 'silk',
      baseColorHex: '#334455',
      available: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fabric.notes.join(' ')).toContain('no texture reference');
    }
  });

  it('notes unavailable fabrics but still resolves them', async () => {
    const unavailable = FIXTURE_FABRICS.find((f) => !f.available);
    expect(unavailable).toBeDefined();
    const result = await adapter.resolve({ fabricId: unavailable!.fabricId });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fabric.notes.join(' ')).toContain('unavailable');
    }
  });

  it('surfaces source lookup failures as errors', async () => {
    const failing: FabricSource = {
      kind: 'failing-test-source',
      lookup: () => Promise.reject(new Error('network down')),
    };
    const failingAdapter = createFabricAdapter(failing);
    const result = await failingAdapter.resolve({ fabricId: 'x' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('network down');
  });

  it('rejects malformed fabric references', async () => {
    const result = await adapter.resolve({} as never);
    expect(result.ok).toBe(false);
  });
});
