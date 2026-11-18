# CHANGELOG — MODULE 04: 3D CLOTHING PREVIEW

All notable changes to this module are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-11-18

Initial development release on branch `arena/f5d8b912-4-clothing-preview`.

### Added

- Reusable `<Shirt3DPreview />` React component (public integration surface
  for Module 01) with `design`, `fabric`, `fabricSource`, `onLoad`,
  `onError`, `onConfigurationChange` (reserved), `initialCameraPreset`,
  `showDesignDetails`, `enablePerfSampling`/`onPerformanceSample` props.
- Procedural parametric shirt model (18 stable component ids): body, sleeves,
  collar (band/leaves/tip-buttons), button panel, 7 front buttons, cuffs
  (incl. french fold ring), pockets, pocket flaps, stitching.
- Design variations with real geometry: collars `classic/spread/button-down/
  mandarin`, sleeves `full/half`, pockets `none/single/double`, flaps
  `none/pointed/rounded`, cuffs `standard/rounded/french`, buttons
  `standard/pearl/dark`, fits `slim/regular/relaxed`.
- Material engine: 4 shared material slots, fabric base colour, button/thread
  colours, per-slot texture-repeat calibration, central disposal.
- Canvas-generated texture patterns `weave/oxford/stripes/checks` (honestly
  labelled as generated, not photographs), cached, fallback-safe.
- Module 03 design adapter: total-function validation, documented defaults,
  explicit unsupported-option notes (no silent substitution).
- Module 02 fabric adapter: replaceable `FabricSource` interface, stable-ID
  lookup, invalid-colour/missing-texture/unknown-id fallbacks.
- Explicitly labelled local fixtures for fabrics and mock designs
  (development stand-ins — NOT live data).
- Camera system: front/back/left/right presets, damped transitions, zoom
  clamps, reset, OrbitControls mouse+touch interaction.
- Honest WebGL fallback (capability detection, error boundary, design
  summary, retry) — never a fake viewer.
- Lazy code-split 3D engine chunk; mobile-first responsive UI; ≥44px touch
  targets; `touch-action` isolation; reduced-motion support.
- 80 automated tests (Vitest + jsdom) — all passing at release time.
- Full documentation set: AUDIT_REPORT, ARCHITECTURE,
  3D_MODEL_SPECIFICATION, MATERIAL_SYSTEM, INTEGRATION, TESTING,
  CONTRIBUTING, MODULE_04_STATUS_REPORT, NEXT_MODULE_HANDOFF.

### Preserved

- `LICENSE` (MIT) byte-identical from the initial commit.
- Repository identity in README (expanded, not replaced).

### Known limitations

- Modules 01/02/03 publish no contracts; fixtures are interim stand-ins.
- No real-device GPU measurements yet (methodology documented).
- Dev-only `picomatch` advisory chain in vite/vitest tooling (latest
  picomatch already installed; zero runtime exposure).
