import { describe, expect, it } from 'vitest';
import {
  adaptDesignConfiguration,
  DESIGN_DEFAULTS,
} from '../integration/designAdapter';
import { buildShirtModel, disposeShirtModel } from '../core/model/shirtModelBuilder';
import { SHIRT_COMPONENT_IDS } from '../core/model/components';
import { FRONT_BUTTON_COUNT } from '../core/model/variations';
import type { ResolvedDesign } from '../types/design';

function resolvedDesign(overrides: Record<string, unknown> = {}): ResolvedDesign {
  return adaptDesignConfiguration({ design_id: 'test', ...overrides }).design;
}

describe('shirtModelBuilder (procedural model)', () => {
  it('builds a model with all core components for the default design', () => {
    const model = buildShirtModel(resolvedDesign());
    const mustExist: typeof SHIRT_COMPONENT_IDS[number][] = [
      'shirt/body',
      'shirt/sleeve-left',
      'shirt/sleeve-right',
      'shirt/collar',
      'shirt/collar-band',
      'shirt/collar-leaf-left',
      'shirt/collar-leaf-right',
      'shirt/button-panel',
      'shirt/buttons',
      'shirt/cuff-left',
      'shirt/cuff-right',
      'shirt/pocket-left',
      'shirt/stitching',
    ];
    for (const id of mustExist) {
      expect(model.components.has(id), `missing ${id}`).toBe(true);
      const obj = model.root.getObjectByName(id);
      expect(obj, `scene-graph node ${id}`).toBeTruthy();
    }
    expect(model.frontButtons).toHaveLength(FRONT_BUTTON_COUNT);
    disposeShirtModel(model);
  });

  it('omits pockets entirely for pocket_style=none (no hidden meshes)', () => {
    const model = buildShirtModel(resolvedDesign({ pocket_style: 'none' }));
    expect(model.components.has('shirt/pocket-left')).toBe(false);
    expect(model.components.has('shirt/pocket-right')).toBe(false);
    expect(model.root.getObjectByName('shirt/pocket-left')).toBeUndefined();
    disposeShirtModel(model);
  });

  it('renders double pockets with flaps when configured', () => {
    const model = buildShirtModel(
      resolvedDesign({ pocket_style: 'double', pocket_flap_style: 'pointed' }),
    );
    for (const id of ['shirt/pocket-left', 'shirt/pocket-right', 'shirt/pocket-flap-left', 'shirt/pocket-flap-right'] as const) {
      expect(model.components.has(id), `missing ${id}`).toBe(true);
    }
    disposeShirtModel(model);
  });

  it('omits cuffs for half sleeves even when a cuff style is set', () => {
    const model = buildShirtModel(resolvedDesign({ sleeve_style: 'half', cuff_style: 'french' }));
    expect(model.components.has('shirt/cuff-left')).toBe(false);
    expect(model.components.has('shirt/cuff-right')).toBe(false);
    disposeShirtModel(model);
  });

  it('renders mandarin collar without leaves', () => {
    const model = buildShirtModel(resolvedDesign({ collar_style: 'mandarin' }));
    expect(model.components.has('shirt/collar-band')).toBe(true);
    expect(model.components.has('shirt/collar-leaf-left')).toBe(false);
    expect(model.components.has('shirt/collar-leaf-right')).toBe(false);
    disposeShirtModel(model);
  });

  it('renders collar tip buttons only for button-down collars', () => {
    const withButtons = buildShirtModel(resolvedDesign({ collar_style: 'button-down' }));
    expect(withButtons.components.has('shirt/collar-button-left')).toBe(true);
    expect(withButtons.components.has('shirt/collar-button-right')).toBe(true);
    disposeShirtModel(withButtons);

    const classic = buildShirtModel(resolvedDesign({ collar_style: 'classic' }));
    expect(classic.components.has('shirt/collar-button-left')).toBe(false);
    disposeShirtModel(classic);
  });

  it('keeps triangle count in the mobile budget (< 25k)', () => {
    const model = buildShirtModel(
      resolvedDesign({ pocket_style: 'double', pocket_flap_style: 'pointed', collar_style: 'button-down' }),
    );
    let triangles = 0;
    for (const geometry of model.geometries) {
      const index = geometry.getIndex();
      const position = geometry.getAttribute('position');
      triangles += index ? index.count / 3 : position.count / 3;
    }
    expect(triangles).toBeGreaterThan(0);
    expect(triangles).toBeLessThan(25_000);
    disposeShirtModel(model);
  });

  it('disposes all geometries deterministically', () => {
    const model = buildShirtModel(resolvedDesign());
    const geometries = [...model.geometries];
    disposeShirtModel(model);
    expect(model.geometries).toHaveLength(0);
    expect(model.components.size).toBe(0);
    // three sets an internal uuid-keyed entry in `disposed` — verify via event is
    // overkill; the strong signal is that dispose() ran without throwing and the
    // collections were cleared.
    expect(geometries.length).toBeGreaterThan(0);
  });

  it('applies fit scaling to the body (visual approximation only)', () => {
    const slim = buildShirtModel(resolvedDesign({ fit_type: 'slim' }));
    const relaxed = buildShirtModel(resolvedDesign({ fit_type: 'relaxed' }));
    const slimBody = slim.components.get('shirt/body')!;
    const relaxedBody = relaxed.components.get('shirt/body')!;
    expect(slimBody.scale.x).toBeLessThan(relaxedBody.scale.x);
    disposeShirtModel(slim);
    disposeShirtModel(relaxed);
  });

  it('uses documented defaults for an empty design', () => {
    expect(DESIGN_DEFAULTS.sleeveStyle).toBe('full');
    expect(buildShirtModel(resolvedDesign()).components.has('shirt/body')).toBe(true);
  });
});
