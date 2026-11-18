import type { FabricRecord, FabricSource } from '../../types/fabric';

/**
 * ⚠️ LOCAL DEVELOPMENT FIXTURES — NOT LIVE MODULE 02 DATA ⚠️
 *
 * These records exist ONLY so Module 04 can be developed and demonstrated
 * while fabric-catalog-system (Module 02) has no published API (its repo is
 * an empty stub — AUDIT_REPORT.md §6). They are NOT real inventory: no
 * supplier, price, stock or availability truth is claimed or implied.
 * `available` flags below are arbitrary demonstration values.
 *
 * When Module 02 ships, replace `LocalFixtureFabricSource` with an API-backed
 * `FabricSource`; do NOT grow this file into a real catalogue.
 */

export const FIXTURE_FABRICS: readonly FabricRecord[] = [
  {
    fabricId: 'fixture-cotton-white',
    displayName: '[FIXTURE] White Cotton (generated weave)',
    fabricType: 'cotton',
    baseColorHex: '#f5f5f0',
    textureRef: 'weave',
    available: true,
  },
  {
    fabricId: 'fixture-cotton-sky',
    displayName: '[FIXTURE] Sky Blue Cotton (generated oxford)',
    fabricType: 'cotton',
    baseColorHex: '#a8c4de',
    textureRef: 'oxford',
    available: true,
  },
  {
    fabricId: 'fixture-linen-sand',
    displayName: '[FIXTURE] Sand Linen (generated weave)',
    fabricType: 'linen',
    baseColorHex: '#d9c9a3',
    textureRef: 'weave',
    available: true,
  },
  {
    fabricId: 'fixture-stripe-navy',
    displayName: '[FIXTURE] Navy Stripe (generated stripes)',
    fabricType: 'cotton-blend',
    baseColorHex: '#33507a',
    textureRef: 'stripes',
    available: true,
  },
  {
    fabricId: 'fixture-check-forest',
    displayName: '[FIXTURE] Forest Check (generated checks)',
    fabricType: 'flannel',
    baseColorHex: '#4a6741',
    textureRef: 'checks',
    available: false, // demonstrates the "unavailable" UI state with fixture data
  },
] as const;

export class LocalFixtureFabricSource implements FabricSource {
  readonly kind = 'local-fixtures';

  private readonly byId = new Map(FIXTURE_FABRICS.map((f) => [f.fabricId, f]));

  async lookup(fabricId: string): Promise<FabricRecord | null> {
    return this.byId.get(fabricId) ?? null;
  }

  /** Demo helper: every fixture id (Module 01 should NOT call this in production). */
  listIds(): string[] {
    return [...this.byId.keys()];
  }
}

export const defaultFabricSource = new LocalFixtureFabricSource();
