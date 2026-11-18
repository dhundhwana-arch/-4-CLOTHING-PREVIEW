import { describe, expect, it } from 'vitest';
import {
  applyMaterialSet,
  createMaterialSet,
  disposeMaterialSet,
} from '../core/materials/materialEngine';
import { disposeTextureCache } from '../core/materials/textureFactory';
import { adaptDesignConfiguration } from '../integration/designAdapter';
import { buildShirtModel, disposeShirtModel } from '../core/model/shirtModelBuilder';
import { MATERIAL_SLOT_IDS, SHIRT_COMPONENT_IDS, COMPONENT_MATERIAL_SLOT } from '../core/model/components';
import type { ResolvedFabric } from '../types/fabric';

const fixtureFabric: ResolvedFabric = {
  record: {
    fabricId: 'fixture-cotton-sky',
    displayName: '[FIXTURE] Sky Blue Cotton',
    fabricType: 'cotton',
    baseColorHex: '#a8c4de',
    textureRef: 'oxford',
    available: true,
  },
  fromFixture: true,
  notes: [],
};

describe('materialEngine', () => {
  it('creates exactly one material per slot', () => {
    const design = adaptDesignConfiguration({}).design;
    const set = createMaterialSet(design, fixtureFabric, { disableTextures: true });
    expect(Object.keys(set.materials).sort()).toEqual([...MATERIAL_SLOT_IDS].sort());
    disposeMaterialSet(set);
  });

  it('applies the fabric base colour to cloth slots', () => {
    const design = adaptDesignConfiguration({}).design;
    const set = createMaterialSet(design, fixtureFabric, { disableTextures: true });
    expect(set.materials['cloth-extruded'].color.getHexString()).toBe('a8c4de');
    expect(set.materials['cloth-standard'].color.getHexString()).toBe('a8c4de');
    disposeMaterialSet(set);
  });

  it('applies the design thread colour to the stitching slot', () => {
    const design = adaptDesignConfiguration({ thread_color: '#123456' }).design;
    const set = createMaterialSet(design, fixtureFabric, { disableTextures: true });
    expect(set.materials.thread.color.getHexString()).toBe('123456');
    disposeMaterialSet(set);
  });

  it('applies explicit button colour, else the button-style default', () => {
    const design = adaptDesignConfiguration({ button_style: 'dark' }).design;
    const set = createMaterialSet(design, fixtureFabric, { disableTextures: true });
    expect(set.materials.button.color.getHexString()).toBe('2c2c30');
    disposeMaterialSet(set);

    const tinted = adaptDesignConfiguration({ button_style: 'dark', button_color: '#800000' }).design;
    const tintedSet = createMaterialSet(tinted, fixtureFabric, { disableTextures: true });
    expect(tintedSet.materials.button.color.getHexString()).toBe('800000');
    disposeMaterialSet(tintedSet);
  });

  it('warns and falls back to flat colour for non-generated texture refs', () => {
    const fabric: ResolvedFabric = {
      ...fixtureFabric,
      record: { ...fixtureFabric.record, textureRef: 'https://unverified.example/photo.jpg' },
    };
    const design = adaptDesignConfiguration({}).design;
    const set = createMaterialSet(design, fabric);
    expect(set.textureApplied).toBe(false);
    expect(set.warnings.join(' ')).toContain('not a supported generated pattern');
    expect(set.materials['cloth-extruded'].map).toBeNull();
    disposeMaterialSet(set);
  });

  it('warns instead of crashing when canvas 2D is unavailable', () => {
    const design = adaptDesignConfiguration({}).design;
    // jsdom exposes document + canvas but getContext('2d') returns null,
    // which exercises the real degraded path.
    const set = createMaterialSet(design, fixtureFabric);
    expect(set.warnings.length + (set.textureApplied ? 1 : 0)).toBeGreaterThan(0);
    disposeTextureCache();
    disposeMaterialSet(set);
  });

  it('assigns every mesh a material matching its recorded slot', () => {
    const design = adaptDesignConfiguration({ pocket_style: 'double', pocket_flap_style: 'rounded' }).design;
    const model = buildShirtModel(design);
    const set = createMaterialSet(design, fixtureFabric, { disableTextures: true });
    const assigned = applyMaterialSet(model.root, set);
    expect(assigned).toBeGreaterThan(0);

    model.root.traverse((obj) => {
      const mesh = obj as { isMesh?: boolean; userData: Record<string, unknown>; material?: unknown };
      if (mesh.isMesh) {
        const slot = mesh.userData.materialSlot as string;
        expect(MATERIAL_SLOT_IDS).toContain(slot);
        expect(mesh.material).toBe(set.materials[slot as keyof typeof set.materials]);
      }
    });

    disposeMaterialSet(set);
    disposeShirtModel(model);
  });

  it('keeps a material slot mapping for every known component', () => {
    for (const id of SHIRT_COMPONENT_IDS) {
      expect(COMPONENT_MATERIAL_SLOT[id]).toBeDefined();
    }
  });
});
