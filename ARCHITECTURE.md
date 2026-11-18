# ARCHITECTURE — MODULE 04: 3D CLOTHING PREVIEW

## 1. Overview

Module 04 is a **read-only 3D visualization engine**. It receives an
already-authored design configuration (Module 03's job) plus fabric data
(Module 02's job), and renders an interactive three-dimensional
approximation. It owns no design editing, no fabric inventory, no pricing,
no orders.

```
 MODULE 03 (2D designer)                 MODULE 02 (fabric catalog)
        │ design configuration                    │ fabric record / id
        ▼                                         ▼
 ┌─────────────────┐                    ┌──────────────────────┐
 │  DESIGN ADAPTER │                    │    FABRIC ADAPTER     │
 │  validate       │                    │  FabricSource (iface) │
 │  default        │                    │  resolve + fallback   │
 │  report notes   │                    │  fixtures (labelled)  │
 └───────┬─────────┘                    └──────────┬───────────┘
         │ ResolvedDesign                          │ ResolvedFabric
         └─────────────────┬───────────────────────┘
                           ▼
              ┌─────────────────────────┐
              │  <Shirt3DPreview />     │   ← Module 01 entry point
              │  WebGL detection        │
              │  (lazy) PreviewScene    │
              └───────────┬─────────────┘
              ┌───────────▼─────────────┐
              │ MODEL BUILDER           │  procedural parametric geometry
              │ (component registry)    │  18 stable component ids
              └───────────┬─────────────┘
              ┌───────────▼─────────────┐
              │ MATERIAL ENGINE         │  4 material slots, generated
              │ + texture factory       │  textures, fallback-safe
              └───────────┬─────────────┘
              ┌───────────▼─────────────┐
              │ RENDERER (R3F Canvas)   │  studio lighting, OrbitControls,
              │ + CameraRig presets     │  damped preset transitions
              └───────────┬─────────────┘
                          ▼
                INTERACTIVE 3D VIEW
                (or honest fallback)
```

## 2. Rendering Lifecycle

1. **Mount** `<Shirt3DPreview design fabric … />`.
2. **Design adaptation (sync):** `adaptDesignConfiguration(design)` →
   `ResolvedDesign` + non-fatal `AdaptationNote[]`. Total function: any
   input — including garbage — yields a renderable design with notes.
3. **Fabric resolution (async):** `createFabricAdapter(source).resolve(ref)`
   → `ResolvedFabric | error`. Errors render a fabric-unavailable state and
   fire `onError({ code: 'fabric-not-found' })`; they never crash the viewer.
4. **WebGL detection:** `detectWebGLSupport()`. Unsupported →
   `<WebGLFallback/>` with the resolved design summary + retry. **The lazy
   3D engine chunk is never downloaded on this path.**
5. **Scene mount (lazy chunk loaded):** `buildShirtModel(ResolvedDesign)`
   creates geometry once per design; `createMaterialSet` creates 4 shared
   materials once per (design, fabric); `applyMaterialSet` binds slots.
6. **Runtime:** OrbitControls (damped) for free interaction; `CameraRig`
   consumes imperative `CameraCommand`s (preset/zoom/reset) and animates
   with `dampedStep`; user pointer input cancels in-flight animation.
7. **Update:** changing `design`/`fabric` props rebuilds only what changed;
   old geometry/materials are disposed deterministically.
8. **Unmount:** all geometries + materials + cached textures disposed.

## 3. Component Boundaries

| Layer | Files | Contract |
|---|---|---|
| Public API | `react/Shirt3DPreview.tsx`, `index.ts` | Stable for Module 01; props in `types/preview.ts` |
| Scene | `react/PreviewScene.tsx`, `ShirtModel.tsx`, `CameraRig.tsx`, `PerfMonitor.tsx` | R3F-only; never imported by adapters |
| Core (pure) | `core/**` | No React, no DOM (texture factory accepts injected canvas); Node-testable |
| Adapters | `integration/designAdapter.ts`, `fabricAdapter.ts` | The ONLY files that change when Module 02/03 publish real contracts |
| Fixtures | `integration/fixtures/**` | Labelled development data — deletable once live integration lands |
| Demo | `demo/**` | Not part of the library surface |

## 4. State Management

Deliberately minimal — no global store.

- **Resolved design:** `useMemo` from props (props are the source of truth;
  Module 01/03 owns edits).
- **Resolved fabric:** `useState` + `useEffect` (async, cancellation-guarded).
- **Camera commands:** small `{ type, preset?, nonce }` state consumed by
  `CameraRig`; the nonce lets repeated identical commands retrigger.
- **No prop-drilling of three.js objects:** model/materials live inside the
  Canvas subtree.

## 5. Model Loading

Procedural — there is no network model fetch. `buildShirtModel` is
synchronous (~1 ms of geometry math), returns a `THREE.Group` plus a
stable-id component map, and records every geometry for disposal. The lazy
chunk boundary means the *code* for building/rendering loads only when
WebGL exists. See `3D_MODEL_SPECIFICATION.md`.

## 6. Material Assignment

`MaterialSlotId` (`cloth-extruded`, `cloth-standard`, `button`, `thread`)
is the join key: the builder tags every mesh with `userData.materialSlot`,
the material engine creates one shared material per slot, and
`applyMaterialSet` binds them. Per-slot texture-repeat calibration keeps
generated patterns visually consistent across extruded vs. standard UV
spaces. Full detail: `MATERIAL_SYSTEM.md`.

## 7. Texture Loading

Today: canvas-generated tiles (weave/oxford/stripes/checks), cached by
`pattern:colour:size`, disposed centrally. Future (Module 02 photography):
`TextureLoader` behind the same contract — **any** texture failure degrades
to flat base colour + warning, never an exception.

## 8. Configuration Flow (Module 03 → 04)

```
raw JSON ─▶ adaptDesignConfiguration ─▶ ResolvedDesign + notes
                                        │        │
                        unsupported ────┘        └─▶ rebuild model/materials
                        values replaced            (React diff via useMemo deps)
                        WITH notes shown
                        in the details panel
```

A supported 2D design change therefore always produces a corresponding 3D
change (covered by an integration test), and unsupported input is visible
to the user rather than silently swapped.

## 9. Fabric Flow (Module 02 → 04)

```
fabricId / record ─▶ FabricSource.lookup ─▶ validate colour/texture/availability
                                          ─▶ ResolvedFabric (+ notes)
                                          ─▶ material engine
```

`FabricSource` is injected: `LocalFixtureFabricSource` today, an HTTP-backed
source when Module 02 ships. Nothing else changes.

## 10. Error Handling

| Failure | Behaviour |
|---|---|
| Invalid design input | Defaults + visible notes; viewer still renders |
| Unknown fabric id | `onError(fabric-not-found)` + fabric-unavailable panel |
| Fabric source throws | Same clean error path |
| Invalid fabric colour | Neutral grey fallback + note |
| Missing/failed texture | Flat colour + warning; preview continues |
| WebGL unavailable | Honest fallback UI + design summary + retry |
| Render-time exception | `PreviewErrorBoundary` → fallback UI + `onError(render-failure)` |

## 11. Performance Strategy

- Procedural geometry, radial segments capped (20); worst-case model
  < 25k triangles (enforced by test) — trivial for mobile GPUs
- 4 shared materials total; one cached texture tile per pattern/colour
- DPR clamped to [1, 2]; antialias at clamped DPR; no post-processing;
  contact shadow instead of shadow-map passes
- Code-split 3D engine (lazy) — fallback users download ~zero 3D code
- Deterministic disposal (geometries, materials, texture cache)
- `frameloop` stays `always` only because controls use damping; a future
  `demand` mode is documented in the handoff
- Opt-in `PerfMonitor` reports **measured** FPS to the host

## 12. Integration Boundaries

- Module 04 consumes; it never mutates Module 02/03 state.
- Shared identifiers (`ShirtComponentId`, material slots, option ids) are
  exported from `src/index.ts` and versioned with this package.
- Module 01 embeds `<Shirt3DPreview/>`; the library build (`npm run
  build:lib`) keeps react/three external so the host controls versions.

## 13. Key Decisions (ADR summary)

| # | Decision | Rationale |
|---|---|---|
| ADR-1 | Procedural model, no GLB | No licensed asset exists; rules forbid fabricating assets; parametric = exact variation control + testability + zero download |
| ADR-2 | Generated canvas textures | Same honesty/licensing rationale; clearly not photographs |
| ADR-3 | Adapters, not assumptions | Module 02/03 contracts don't exist; isolated replaceable boundaries |
| ADR-4 | R3F + drei | Smallest mainstream typed stack; scene graph still Node-testable |
| ADR-5 | Lazy 3D chunk | WebGL-fallback users never pay the three.js download |
