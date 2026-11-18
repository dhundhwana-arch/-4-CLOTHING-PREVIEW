import { describe, expect, it } from 'vitest';
import { adaptDesignConfiguration, DESIGN_DEFAULTS } from '../integration/designAdapter';

describe('designAdapter (Module 03 boundary)', () => {
  it('resolves a complete valid configuration verbatim', () => {
    const { ok, design, notes } = adaptDesignConfiguration({
      design_id: 'd-1',
      fabric_id: 'fixture-cotton-sky',
      collar_style: 'spread',
      pocket_style: 'double',
      pocket_flap_style: 'pointed',
      sleeve_style: 'full',
      cuff_style: 'standard',
      button_style: 'dark',
      button_color: '#222222',
      thread_color: '#AABBCC',
      fit_type: 'slim',
    });
    expect(ok).toBe(true);
    expect(design).toEqual({
      designId: 'd-1',
      fabricId: 'fixture-cotton-sky',
      collarStyle: 'spread',
      pocketStyle: 'double',
      pocketFlapStyle: 'pointed',
      sleeveStyle: 'full',
      cuffStyle: 'standard',
      buttonStyle: 'dark',
      buttonColor: '#222222',
      threadColor: '#aabbcc',
      fitType: 'slim',
    });
    // Verbatim input → zero fallback notes of any kind.
    expect(notes.filter((n) => n.code === 'unsupported-value')).toHaveLength(0);
  });

  it('applies documented defaults for a missing configuration', () => {
    const { design, notes } = adaptDesignConfiguration(undefined);
    expect(design.collarStyle).toBe(DESIGN_DEFAULTS.collarStyle);
    expect(design.sleeveStyle).toBe(DESIGN_DEFAULTS.sleeveStyle);
    expect(design.pocketStyle).toBe(DESIGN_DEFAULTS.pocketStyle);
    expect(design.fitType).toBe(DESIGN_DEFAULTS.fitType);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((n) => n.code === 'default-applied')).toBe(true);
  });

  it('flags unsupported options instead of silently substituting', () => {
    const { design, notes } = adaptDesignConfiguration({ collar_style: 'wing-tip' });
    expect(design.collarStyle).toBe(DESIGN_DEFAULTS.collarStyle);
    const note = notes.find((n) => n.field === 'collar_style');
    expect(note?.code).toBe('unsupported-value');
    expect(note?.message).toContain('wing-tip');
  });

  it('rejects invalid colour values with an explicit note', () => {
    const { design, notes } = adaptDesignConfiguration({ thread_color: 'red-ish?' });
    expect(design.threadColor).toBe(DESIGN_DEFAULTS.threadColor);
    expect(notes.find((n) => n.field === 'thread_color')?.code).toBe('invalid-value');
  });

  it('records unknown fields as ignored, never crashes', () => {
    const { notes } = adaptDesignConfiguration({ price_override: 9999 });
    expect(notes.find((n) => n.field === 'price_override')?.code).toBe('unknown-field');
  });

  it('warns when a cuff style is requested with half sleeves', () => {
    const { notes, design } = adaptDesignConfiguration({ sleeve_style: 'half', cuff_style: 'french' });
    expect(design.sleeveStyle).toBe('half');
    const note = notes.find((n) => n.field === 'cuff_style');
    expect(note?.code).toBe('unsupported-value');
    expect(note?.message).toContain('half');
  });

  it('handles non-object input as a total function', () => {
    for (const bad of [null, 42, 'shirt', [1, 2]]) {
      const { ok, design } = adaptDesignConfiguration(bad);
      expect(ok).toBe(true);
      expect(design.collarStyle).toBe(DESIGN_DEFAULTS.collarStyle);
    }
  });

  it('never throws on hostile input shapes', () => {
    expect(() => adaptDesignConfiguration({ collar_style: { evil: true } })).not.toThrow();
  });
});
