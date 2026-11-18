import {
  isFabricRecord,
  type FabricRecord,
  type FabricReference,
  type FabricResolution,
  type FabricSource,
  type ResolvedFabric,
} from '../types/fabric';
import { normalizeHexColor } from '../core/validation/validators';

/**
 * MODULE 02 ADAPTER — isolated boundary between fabric-catalog-system and
 * the 3D preview engine.
 *
 * Module 02 owns all fabric data. Its repository is currently an empty stub
 * (AUDIT_REPORT.md §6), so this adapter resolves fabrics through the
 * replaceable `FabricSource` interface. The shipped source reads LABELLED
 * LOCAL FIXTURES — development stand-ins, NOT live integration, NOT real
 * inventory. When Module 02 publishes its real API, implement `FabricSource`
 * against it and pass it as `<Shirt3DPreview fabricSource={...} />`.
 * Nothing else in this module needs to change.
 *
 * Failure contract (never crashes the preview):
 *  - unknown fabric id  → { ok:false, error } — the host renders a notice
 *  - invalid colour     → neutral grey fallback + note
 *  - missing texture    → flat colour fallback + note
 *  - unavailable fabric → still resolvable, but flagged for the host UI
 */

export interface FabricAdapter {
  resolve(ref: FabricReference): Promise<FabricResolution>;
}

export const FABRIC_FALLBACK_COLOR = '#9aa0a6'; // neutral grey

export function createFabricAdapter(source: FabricSource): FabricAdapter {
  return {
    async resolve(ref: FabricReference): Promise<FabricResolution> {
      const notes: string[] = [];
      let record: FabricRecord | null = null;
      let fromFixture = false;

      if (isFabricRecord(ref)) {
        record = ref;
        fromFixture = source.kind === 'local-fixtures';
      } else if (ref && typeof ref.fabricId === 'string') {
        try {
          record = await source.lookup(ref.fabricId);
          fromFixture = source.kind === 'local-fixtures';
        } catch (cause) {
          return {
            ok: false,
            fabricId: ref.fabricId,
            error: `Fabric lookup failed for "${ref.fabricId}": ${cause instanceof Error ? cause.message : String(cause)}`,
          };
        }
        if (!record) {
          return {
            ok: false,
            fabricId: ref.fabricId,
            error: `Fabric "${ref.fabricId}" was not found in source "${source.kind}".`,
          };
        }
      } else {
        return { ok: false, fabricId: '(missing)', error: 'Fabric reference is missing or malformed.' };
      }

      const normalizedColor = normalizeHexColor(record.baseColorHex);
      if (!normalizedColor) {
        notes.push(
          `Fabric "${record.fabricId}" has invalid baseColorHex "${String(record.baseColorHex)}"; neutral grey fallback applied.`,
        );
        record = { ...record, baseColorHex: FABRIC_FALLBACK_COLOR };
      } else {
        record = { ...record, baseColorHex: normalizedColor };
      }

      if (!record.textureRef) {
        notes.push(`Fabric "${record.fabricId}" has no texture reference; flat colour rendering.`);
      }
      if (!record.available) {
        notes.push(`Fabric "${record.fabricId}" is flagged unavailable by its source.`);
      }

      const resolved: ResolvedFabric = { record, fromFixture, notes };
      return { ok: true, fabric: resolved };
    },
  };
}
