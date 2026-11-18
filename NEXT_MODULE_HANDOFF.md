# NEXT MODULE HANDOFF — Integrating MODULE 04 (3D CLOTHING PREVIEW)

**Audience:** developers of MODULE 01 (`custom-shirt-studio`, host platform)
and MODULE 03 (`-3-2D-CLOTHING-DESIGNER`, design source), and MODULE 02
(`fabric-catalog-system`, fabric source).

**Status of this handoff:** Module 04's side is complete and tested. Module
01/02/03 sides are **pending** because their contracts don't exist yet
(verified 2026-11-18 — see AUDIT_REPORT.md §6). Nothing here is a live
integration claim.

---

## 1. Integration Entry Point

```tsx
import { Shirt3DPreview } from '@custom-shirt-studio/3d-clothing-preview';
```

- Source import: `src/index.ts` (works today with a shared monorepo install
  or a git/npm dependency on this repository).
- Bundled: `npm run build:lib` → `dist-lib/shirt-3d-preview.js` (ES module,
  `react`/`react-dom`/`three`/`@react-three/*` kept external — the host app
  provides them; dedupe `three` in the host bundler).
- CSS: the component self-imports `preview.css` (bundled build emits
  `dist-lib/3d-clothing-preview.css` — include it once).

## 2. What Module 01 Must Supply

| Input | Source | Notes |
|---|---|---|
| `design` prop | Module 03 output | see §3 contract |
| `fabric` prop | Module 02 | `{ fabricId }` (resolved via `fabricSource`) or full record |
| `fabricSource` prop | Module 02 | production `FabricSource` implementation (§4) |
| layout slot | Module 01 | component is responsive: width 100%, aspect-ratio stage, max 960px |
| callbacks | Module 01 | `onLoad`, `onError`, optionally `onPerformanceSample` |

Module 01 should ALSO render Module 04's approximation disclaimer context
where appropriate; the component itself always shows it in the details panel.

## 3. What Module 03 Must Produce (design configuration)

Post to Module 01 (or wherever the composition happens) a plain JSON object.
**Current illustrative field set** (validated by `adaptDesignConfiguration`):

```json
{
  "design_id": "string",
  "fabric_id": "string — must resolve via Module 02",
  "collar_style": "classic | spread | button-down | mandarin",
  "sleeve_style": "full | half",
  "pocket_style": "none | single | double",
  "pocket_flap_style": "none | pointed | rounded",
  "cuff_style": "standard | rounded | french",
  "button_style": "standard | pearl | dark",
  "button_color": "#rrggbb (optional)",
  "thread_color": "#rrggbb (optional)",
  "fit_type": "slim | regular | relaxed"
}
```

Rules for Module 03:

- **Emit only supported option values.** The authoritative lists are exported
  from this package (`COLLAR_STYLES`, `SLEEVE_STYLES`, `POCKET_STYLES`,
  `POCKET_FLAP_STYLES`, `CUFF_STYLES`, `BUTTON_STYLES`, `FIT_TYPES`) — drive
  the 2D designer's UI from them so a user can never pick an unrenderable
  option.
- Every field may be omitted; Module 04 applies documented defaults.
- If Module 03's real schema differs, **only `src/integration/designAdapter.ts`
  changes** — coordinate the mapping there, don't fork the component.

## 4. What Module 02 Must Provide (fabric source)

Implement the `FabricSource` interface:

```ts
interface FabricSource {
  readonly kind: string;
  lookup(fabricId: string): Promise<FabricRecord | null>;
}
```

`FabricRecord`: `{ fabricId, displayName, fabricType, baseColorHex, textureRef?, imageRef?, available }`.

- `baseColorHex` must be `#rgb`/`#rrggbb` (invalid → neutral grey fallback).
- `textureRef`: today the generated pattern ids (`weave/oxford/stripes/
  checks`); real fabric photography is a pending joint decision (formats,
  hosting, licensing metadata — see MATERIAL_SYSTEM.md §7).
- Return `null` for unknown ids — Module 04 renders the honest
  fabric-unavailable state.
- Until this exists, the demo uses `LocalFixtureFabricSource` (labelled
  fixtures — never treat them as inventory).

## 5. Component Mapping (2D design → 3D components)

| 2D choice | 3D effect |
|---|---|
| `collar_style` | collar band always; leaves for classic/spread/button-down; tip buttons for button-down; band-only for mandarin |
| `sleeve_style` | full/half sleeve geometry; half suppresses cuffs (note shown) |
| `pocket_style` | none/left/both chest pockets |
| `pocket_flap_style` | pointed/rounded flap above each rendered pocket |
| `cuff_style` | cuff geometry (standard/rounded/french incl. fold ring) |
| `button_style`/`button_color` | 7 placket buttons (+2 collar tip), colour/roughness |
| `thread_color` | stitching strips (hem, placket, shoulders) |
| `fit_type` | silhouette scale only — never presented as fit prediction |
| `fabric.baseColorHex`/`textureRef` | cloth material colour/pattern |

## 6. Error Handling for Hosts

Subscribe to `onError`. Codes: `webgl-unavailable`, `render-failure`,
`fabric-not-found`, `fabric-unavailable`, `design-invalid`,
`texture-load-failed`, `unknown`. The component always renders an honest
state by itself; hosts only need to decide whether to *also* log/report.

## 7. Example Usage (complete)

```tsx
import { useState } from 'react';
import { Shirt3DPreview, type PreviewError } from '@custom-shirt-studio/3d-clothing-preview';
// import { Module02HttpFabricSource } from 'fabric-catalog-system'; // when it exists

export function ShirtPreviewPage({ design }) {
  const [ready, setReady] = useState(false);
  return (
    <>
      {!ready && <Skeleton />}
      <Shirt3DPreview
        design={design}
        fabric={{ fabricId: design.fabric_id }}
        // fabricSource={new Module02HttpFabricSource('/api/fabrics')}
        onLoad={() => setReady(true)}
        onError={(e: PreviewError) => console.warn('[3d-preview]', e.code, e.message)}
        initialCameraPreset="front"
      />
    </>
  );
}
```

## 8. Pending Contract Decisions (owners needed)

1. **Module 03 schema** — final field names/enumerations; whether
   `button_id`/`thread_id` catalogue references replace inline colours.
2. **Module 02 transport** — REST endpoint shape, auth, caching, and texture
   asset delivery/licensing.
3. **ID governance** — which system allocates `design_id`/`fabric_id`.
4. **Theming** — whether Module 01's design system should override the
   `s3d-*` tokens (CSS variables are exposed for this).
5. **`frameloop` policy** — `demand` mode is possible once hosts confirm the
   controls they need (saves battery on low-end devices).

## 9. Verification Requirements (before claiming live integration)

- [ ] Module 02 `FabricSource` resolves ≥ 3 real fabrics end-to-end in a
      Module 01 page.
- [ ] Module 03 output renders pixel-correct component changes for every
      supported option (manual checklist against §5).
- [ ] `onError` paths exercised with a deliberately bad fabric id.
- [ ] Real-device FPS sampled (`enablePerfSampling`) on at least one
      low-end Android + one iPhone; numbers recorded in TESTING.md.
- [ ] Only then may documentation say IMPLEMENTED (live) instead of
      INTEGRATION-PENDING.
