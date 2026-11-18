# CUSTOM SHIRT STUDIO — Module 04: 3D CLOTHING PREVIEW

> Interactive, reusable 3D shirt preview engine. Customers inspect their
> configured shirt — front, back, sides, free 360° rotation, zoom — before
> ordering. **The preview is a visual approximation; actual fabric appearance
> and garment fit may vary.**

**Repository:** https://github.com/dhundhwana-arch/-4-CLOTHING-PREVIEW
**Ecosystem:** CUSTOM SHIRT STUDIO (8 modules — this is Module 04, the
three-dimensional visualization layer **only**)
**License:** MIT (see [LICENSE](./LICENSE), preserved from the initial commit)

---

## 1. Module Responsibility

| Owns | Does NOT own |
|---|---|
| 3D rendering of a configured shirt | Design capture/editing → **Module 03** (`-3-2D-CLOTHING-DESIGNER`) |
| Camera, lighting, interaction | Fabric catalogue truth → **Module 02** (`fabric-catalog-system`) |
| Design/fabric → 3D *adaptation* | Customer-facing shell → **Module 01** (`custom-shirt-studio`) |
| WebGL fallback UX | Pricing (05), measurements (06), orders (07), admin (08) |

## 2. Features

**IMPLEMENTED**

- Interactive 3D shirt viewer: drag-to-rotate (mouse + touch), pinch/scroll
  zoom, clamped zoom limits, damped orbit controls
- Camera presets: **FRONT / BACK / LEFT / RIGHT** + **RESET CAMERA**, smooth
  damped transitions, cancelled by user input
- Procedural parametric shirt model with 18 stable, addressable components
  (body, sleeves, collar, placket, buttons, cuffs, pockets, flaps, stitching)
- Design variations with real geometry: 4 collars, 2 sleeve lengths, 3 pocket
  layouts, 3 flap styles, 3 cuff styles, 3 button styles, 3 fits
- Material engine: fabric base colour, generated weave/oxford/stripe/check
  textures, per-slot texture repeat calibration, button + thread materials
- Module 03 design adapter: validation, documented defaults, explicit
  unsupported-option fallbacks (never silent substitution)
- Module 02 fabric adapter: replaceable `FabricSource` interface, stable-ID
  resolution, invalid-colour and missing-texture fallbacks
- Graceful WebGL fallback: capability detection, error boundary, honest
  text-summary fallback UI with retry — never a fake viewer
- Lazy-loaded 3D engine (code-split; fallback users never download three.js)
- Mobile-first responsive UI, ≥44px touch targets, `touch-action` isolation
- Accessibility: semantic buttons, `aria-pressed` state, `role="alert"`/`status`
  live regions, reduced-motion support
- Opt-in real FPS sampling (`enablePerfSampling` + `onPerformanceSample`)
- 80 automated tests (Vitest + jsdom), TypeScript strict mode, zero `any`

**MOCKED (explicitly labelled)** — fabric records & design configurations in
`src/integration/fixtures/` are development stand-ins because Modules 02/03
publish no contracts yet (see [AUDIT_REPORT.md](./AUDIT_REPORT.md) §6).

**PENDING** — live Module 02/03 integration, verified fabric photography,
real-device GPU performance measurements (methodology ready in
[TESTING.md](./TESTING.md)).

## 3. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Renderer | Three.js `0.187` (WebGL2/WebGL1) | Industry standard, headless-testable scene graph |
| React bridge | React Three Fiber `9` + drei `10` | Declarative scene, maintained OrbitControls |
| App framework | React `19` + TypeScript `~5.9` (strict) | Reusable typed component for Module 01 |
| Build | Vite `8` (+ library build config) | Fast dev, code-split ES builds |
| Tests | Vitest `5` + jsdom + Testing Library | GPU-free CI; WebGL-fallback path is directly testable |
| 3D assets | **Procedural geometry** (no GLB) | No licensed shirt asset exists; zero geometry download; exact per-component control |
| Textures | **Canvas-generated** patterns | No fabricated photography; deterministic, cached, tiny |

## 4. Installation & Commands

```bash
npm install          # install dependencies (Node ≥ 20)
npm run dev          # dev server with the interactive demo harness
npm test             # run the full automated test suite (Vitest)
npm run test:coverage
npm run build        # typecheck + production demo build → dist/
npm run build:lib    # library build for Module 01 → dist-lib/
npm run preview      # serve the production build locally
```

## 5. Usage (integration entry point)

```tsx
import { Shirt3DPreview } from '@custom-shirt-studio/3d-clothing-preview';

<Shirt3DPreview
  design={{                       // Module 03 output (illustrative contract)
    design_id: 'd-123',
    fabric_id: 'fixture-cotton-sky',
    collar_style: 'spread',
    sleeve_style: 'full',
    pocket_style: 'single',
    cuff_style: 'standard',
    button_style: 'pearl',
    thread_color: '#d8d8d8',
    fit_type: 'regular',
  }}
  fabric={{ fabricId: 'fixture-cotton-sky' }}   // Module 02 reference or record
  // fabricSource={myModule02Source}            // replaceable boundary
  onLoad={(info) => console.log('ready', info)}
  onError={(err) => console.error(err.code, err.message)}
  initialCameraPreset="front"
/>
```

Full contract: [INTEGRATION.md](./INTEGRATION.md) · Handoff for Module 01/03:
[NEXT_MODULE_HANDOFF.md](./NEXT_MODULE_HANDOFF.md)

## 6. Project Layout

```
src/
├── types/            design, fabric, preview contracts (documented as illustrative)
├── core/
│   ├── model/        component registry, variation specs, procedural shirt builder
│   ├── materials/    material engine + generated-texture factory
│   ├── camera/       camera presets + damped-step math (pure, unit-tested)
│   ├── validation/   shared validators (pure)
│   └── webgl/        capability detection
├── integration/      designAdapter (Module 03), fabricAdapter (Module 02),
│   └── fixtures/     ⚠️ LABELLED local fixtures — not live data
├── react/            <Shirt3DPreview/> + scene, rig, controls, panels, fallback
├── demo/             development/demo harness (fixture-driven)
└── test/             Vitest suites (80 tests)
```

## 7. Asset Requirements

None today: geometry is procedural and textures are canvas-generated.
When Module 02 provides verified fabric photography, textures become remote
assets loaded through the material engine's fallback-safe pipeline —
requirements in [MATERIAL_SYSTEM.md](./MATERIAL_SYSTEM.md) §7.

## 8. Known Limitations

1. **Stylized model, not cloth simulation.** No fabric physics, drape, or
   fit prediction is claimed or implemented.
2. **Fixtures, not live data.** Module 02/03 contracts don't exist yet;
   adapters + labelled fixtures are the interim boundary.
3. **Generated textures are not photographs** of real fabric.
4. **Extrude-geometry UVs** are shape-space; texture scale is calibrated per
   material slot (approximation, documented).
5. **GPU-dependent rendering** can't be verified inside CI; real-device
   numbers must be captured with the built-in FPS sampler (methodology in
   TESTING.md).
6. `npm audit` flags a dev-only `picomatch` advisory chain
   (vite/vitest tooling, already on the latest picomatch 4.0.7, zero runtime
   exposure — `npm audit --omit=dev` is clean). Details: TESTING.md §Security.

## 9. Documentation

| Doc | Content |
|---|---|
| [AUDIT_REPORT.md](./AUDIT_REPORT.md) | Repository + ecosystem audit (Phase A) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture, lifecycle, boundaries |
| [3D_MODEL_SPECIFICATION.md](./3D_MODEL_SPECIFICATION.md) | Model hierarchy, components, variations |
| [MATERIAL_SYSTEM.md](./MATERIAL_SYSTEM.md) | Materials, textures, fallbacks, licensing |
| [INTEGRATION.md](./INTEGRATION.md) | Module 01/02/03 contracts & adapter mapping |
| [TESTING.md](./TESTING.md) | Test strategy, executed results, performance |
| [MODULE_04_STATUS_REPORT.md](./MODULE_04_STATUS_REPORT.md) | Full development status report |
| [NEXT_MODULE_HANDOFF.md](./NEXT_MODULE_HANDOFF.md) | Integration handoff for Module 01/03 |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution rules |

## 10. Current Implementation Status

**v0.1.0 — FUNCTIONAL, INTEGRATION-PENDING.** The viewer is complete and
tested against labelled fixtures; live Module 02/03 wiring awaits their
published contracts.
