/**
 * MODULE 02 (fabric-catalog-system) integration contract — ILLUSTRATIVE.
 *
 * Module 02 is the source of truth for fabric data. Its repository is an
 * empty stub as of 2026-11-18 (AUDIT_REPORT.md §6), so Module 04 defines
 * this minimal read contract and ships explicitly labelled LOCAL FIXTURES
 * behind a replaceable `FabricSource` interface. No real inventory, pricing,
 * supplier or stock data exists in this module, and none may be invented.
 */

/** Fabric record as Module 04 needs it. Field names are assumed, not verified. */
export interface FabricRecord {
  /** Stable fabric identifier owned by Module 02. */
  fabricId: string;
  displayName: string;
  /** Weave / material family, e.g. "cotton", "linen". Free text. */
  fabricType: string;
  /** Primary colour as `#rrggbb`. Drives the material base colour. */
  baseColorHex: string;
  /**
   * Optional texture reference. In fixtures this is a generated-pattern key
   * (see textureFactory). With a real Module 02 it would be an asset URL.
   */
  textureRef?: string;
  /** Optional human-facing image reference (not used for 3D materials). */
  imageRef?: string;
  /** Module 02 availability flag. Unavailable fabric is rendered with a notice. */
  available: boolean;
}

/** A fabric reference as passed by a host: either an id to resolve or a full record. */
export type FabricReference = { fabricId: string } | FabricRecord;

export function isFabricRecord(ref: FabricReference): ref is FabricRecord {
  return typeof (ref as FabricRecord).baseColorHex === 'string';
}

/**
 * Replaceable lookup boundary for Module 02. The production implementation
 * will call the real fabric-catalog-system; the development implementation
 * (`LocalFixtureFabricSource`) reads labelled local fixtures.
 */
export interface FabricSource {
  readonly kind: string;
  lookup(fabricId: string): Promise<FabricRecord | null>;
}

export interface ResolvedFabric {
  record: FabricRecord;
  /** True when `record` came from a fixture source, not live Module 02. */
  fromFixture: boolean;
  /** Non-fatal notes, e.g. texture missing → flat colour fallback applied. */
  notes: string[];
}

export type FabricResolution =
  | { ok: true; fabric: ResolvedFabric }
  | { ok: false; error: string; fabricId: string };
