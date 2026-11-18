import { describe, expect, it } from 'vitest';
import { adaptDesignConfiguration } from '../integration/designAdapter';
import { createFabricAdapter } from '../integration/fabricAdapter';
import { LocalFixtureFabricSource, FIXTURE_FABRICS } from '../integration/fixtures/fabricFixtures';
import { MOCK_DESIGNS } from '../integration/fixtures/mockDesigns';
import { buildShirtModel, disposeShirtModel } from '../core/model/shirtModelBuilder';

/**
 * Integration tests: full pipeline from raw Module-03-style configuration
 * + Module-02-style fabric reference → resolved → built 3D model.
 */
describe('end-to-end pipeline (adapters → model)', () => {
  const adapter = createFabricAdapter(new LocalFixtureFabricSource());

  it('every mock design resolves and builds a valid model', async () => {
    for (const [name, mock] of Object.entries(MOCK_DESIGNS)) {
      const { design, notes } = adaptDesignConfiguration(mock);
      expect(notes.filter((n) => n.code === 'unsupported-value' && n.field !== 'cuff_style'), name).toHaveLength(0);

      const fabric = await adapter.resolve({ fabricId: design.fabricId });
      expect(fabric.ok, name).toBe(true);

      const model = buildShirtModel(design);
      expect(model.components.get('shirt/body'), name).toBeTruthy();
      expect(model.frontButtons.length, name).toBeGreaterThan(0);
      disposeShirtModel(model);
    }
  });

  it('fabric ids stay stable across resolutions (stable ID mapping)', async () => {
    for (const fabric of FIXTURE_FABRICS) {
      const first = await adapter.resolve({ fabricId: fabric.fabricId });
      const second = await adapter.resolve({ fabricId: fabric.fabricId });
      expect(first.ok && second.ok).toBe(true);
      if (first.ok && second.ok) {
        expect(first.fabric.record.fabricId).toBe(second.fabric.record.fabricId);
        expect(first.fabric.record.baseColorHex).toBe(second.fabric.record.baseColorHex);
      }
    }
  });

  it('a design update produces a corresponding model change (2D→3D sync)', () => {
    const before = adaptDesignConfiguration({ pocket_style: 'none' }).design;
    const after = adaptDesignConfiguration({ pocket_style: 'double' }).design;

    const modelBefore = buildShirtModel(before);
    const modelAfter = buildShirtModel(after);

    expect(modelBefore.components.has('shirt/pocket-left')).toBe(false);
    expect(modelAfter.components.has('shirt/pocket-left')).toBe(true);
    expect(modelAfter.components.has('shirt/pocket-right')).toBe(true);

    disposeShirtModel(modelBefore);
    disposeShirtModel(modelAfter);
  });
});
