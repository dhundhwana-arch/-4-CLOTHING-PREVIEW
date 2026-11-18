# INTEGRATION — MODULE 04

> **Contract status (verified 2026-11-18):** Modules 01, 02 and 03 are empty
> repository stubs (AUDIT_REPORT.md §6). All field names below are
> **illustrative assumptions** — documented, isolated behind adapters, and
> replaceable. No live integration exists or is claimed.

## 1. Integration Entry Point (for Module 01)

```tsx
import { Shirt3DPreview } from '@custom-shirt-studio/3d-clothing-preview';
```

### Props (`Shirt3DPreviewProps`)

| Prop | Type | Required | Notes |
|---|---|---|---|
| `design` | `DesignConfiguration` | no | Module 03 output; defaults applied for missing fields |
| `fabric` | `FabricReference` (`{fabricId}` or full `FabricRecord`) | no | defaults to `design.fabric_id` |
| `fabricSource` | `FabricSource` | no | replaceable Module 02 boundary; default = labelled local fixtures |
| `onLoad` | `(info: PreviewLoadInfo) => void` | no | fired when the scene is created |
| `onError` | `(error: PreviewError) => void` | no | structured codes, see §6 |
| `onConfigurationChange` | `(change) => void` | no | reserved for hosts embedding design controls; Module 04 is read-only and never fires it today |
| `initialCameraPreset` | `'front'|'back'|'left'|'right'` | no | default `front` |
| `showDesignDetails` | `boolean` | no | default `true` |
| `enablePerfSampling` + `onPerformanceSample` | — | no | opt-in measured FPS reporting |
| `className` | `string` | no | host styling hook |

### Example

```tsx
<Shirt3DPreview
  design={module03Design}
  fabric={{ fabricId: module03Design.fabric_id }}
  fabricSource={module02HttpSource}   // when Module 02 exists
  onError={(e) => log(e.code, e.message)}
  onLoad={() => hideSkeleton()}
/>
```

## 2. Input: Design Configuration (Module 03 boundary)

Illustrative fields consumed by `adaptDesignConfiguration`:

| Field | Type | Default | Behaviour when unsupported |
|---|---|---|---|
| `design_id` | string | `unsigned-design` | — |
| `fabric_id` | string | `fixture-cotton-white` | — |
| `collar_style` | `classic\|spread\|button-down\|mandarin` | `classic` | note + default rendered |
| `sleeve_style` | `full\|half` | `full` | note + default rendered |
| `pocket_style` | `none\|single\|double` | `single` | note + default rendered |
| `pocket_flap_style` | `none\|pointed\|rounded` | `none` | note + default rendered |
| `cuff_style` | `standard\|rounded\|french` | `standard` | note + default rendered; not rendered on half sleeves |
| `button_style` | `standard\|pearl\|dark` | `standard` | note + default rendered |
| `button_color` | `#rgb/#rrggbb` | style default | note + default |
| `thread_color` | `#rgb/#rrggbb` | `#d8d8d8` | note + default |
| `fit_type` | `slim\|regular\|relaxed` | `regular` | note + default |
| unknown fields | any | — | `unknown-field` note, ignored |

`button_id` / `thread_id` (brief-mentioned) are accepted and ignored with
notes — no Module 02-backed button/thread catalogue exists to resolve them.

The adapter is a **total function**: any input produces a renderable
`ResolvedDesign` plus `AdaptationNote[]`; notes surface in the details panel.

## 3. Input: Fabric Data (Module 02 boundary)

`FabricRecord` (assumed shape): `fabricId`, `displayName`, `fabricType`,
`baseColorHex`, optional `textureRef`, `imageRef`, `available`.

Resolution rules:

- `fabric` prop may be `{ fabricId }` (async lookup via `fabricSource`) or a
  full record (used directly).
- Unknown id → `onError({code:'fabric-not-found'})` + fabric-unavailable UI.
- Invalid colour → neutral grey `#9aa0a6` + note.
- Missing texture → flat colour + note.
- `available:false` → renders, but the details panel flags unavailability.

The shipped `LocalFixtureFabricSource` serves **labelled fixtures only** —
not real inventory. Production hosts must inject a real `FabricSource`.

## 4. Output Interface

- `onLoad({ webgl2, componentCount, designId, fabricId })`
- `onError(PreviewError)` — codes: `webgl-unavailable`, `render-failure`,
  `fabric-not-found`, `fabric-unavailable`, `design-invalid`,
  `texture-load-failed`, `unknown`
- `onPerformanceSample({ fps, frameMs, timestamp })` — measured only, opt-in
- Exported metadata: supported option lists (`COLLAR_STYLES`, …),
  `SHIRT_COMPONENT_IDS`, `CAMERA_PRESETS`, `detectWebGLSupport()`

## 5. Configuration Updates / Preview Synchronization

Module 01/03 re-render with new `design`/`fabric` props; the engine rebuilds
only what changed (React memoization on resolved identities). A supported
design change always updates the corresponding 3D component — verified by
the integration test "a design update produces a corresponding model change".

## 6. Error Handling Contract

Hosts should treat `onError` as informational + keep their own UI usable;
Module 04 always renders *something* honest (fallback panel, fabric-error
panel, or the viewer). Nothing in the public API throws synchronously.

## 7. Unsupported Configurations

By policy: visible fallback + note, never silent substitution. Hosts that
want to pre-validate can call `adaptDesignConfiguration(design)` directly
and inspect `notes`.

## 8. Pending Contract Decisions (blocking live integration)

1. Module 03 real output schema (field names, value enumerations, IDs).
2. Module 02 real fabric record schema + lookup transport (REST? SDK?
   GraphQL?) and texture asset delivery (URLs, formats, licensing metadata).
3. Whether `button_id`/`thread_id` resolve through Module 02 catalogues.
4. Stable ID governance: who owns `fabric_id` / `design_id` allocation.
5. Module 01 embedding decisions: layout slots, theming tokens, SSR policy.
