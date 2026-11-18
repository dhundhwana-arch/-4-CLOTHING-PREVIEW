# TESTING — MODULE 04

## 1. Test Command

```bash
npm test            # vitest run (jsdom environment)
npm run test:coverage
```

## 2. Actual Executed Results

**Command:** `npm test` — executed 2026-11-18, Node v22.22.3, Linux sandbox.

```
Test Files  10 passed (10)
Tests       80 passed (80)
Duration    ~9–10 s
```

| Suite | Tests | Coverage area |
|---|---|---|
| `validators.test.ts` | 6 | hex colours, option membership |
| `designAdapter.test.ts` | 8 | valid/invalid/missing/unsupported configs, hostile input |
| `fabricAdapter.test.ts` | 8 | fixture resolution, unknown ids, invalid colour, source failure |
| `shirtModelBuilder.test.ts` | 10 | component existence per variation, disposal, triangle budget |
| `materialEngine.test.ts` | 8 | slots, colours, fallbacks, assignment |
| `textureFactory.test.ts` | 5 | patterns, caching, no-canvas degradation |
| `cameraAndVariations.test.ts` | 13 | preset geometry, zoom limits, damping, spec consistency |
| `detectWebGL.test.ts` | 5 | supported/unsupported/throwing paths |
| `integration.test.ts` | 3 | full pipeline, stable IDs, 2D→3D sync |
| `previewComponents.test.tsx` | 14 | fallback honesty, details panel, control bar, error callback |
| **Total** | **80** | |

**Passed 80 / Failed 0 / Skipped 0.** These numbers are from the recorded
run above; they were not estimated.

## 3. Environmental Limitations (honest)

1. **jsdom has no GPU/WebGL** — the R3F `<Canvas>` render itself cannot run
   in CI. Covered instead: WebGL-unavailable fallback (the *real* jsdom
   path), adapters, model graph, materials, camera math, UI behaviour.
   The interactive scene is verified in a real browser via the dev-server
   live preview.
2. jsdom's `canvas.getContext('2d')` returns null, so generated-texture
   tests exercise the real *degraded* path; pattern painting is tested with
   an injected stub 2D context.
3. Performance numbers requiring a GPU are **not produced in this sandbox**
   and are **not invented** — see §5.

## 4. Build Verification (executed)

```
npm run build      # tsc --noEmit + vite production build — PASS
npm run build:lib  # library build (react/three external) — PASS
```

Latest demo build artefacts (this machine):

| File | Size | Gzip |
|---|---|---|
| `dist/index.html` | 0.66 kB | 0.40 kB |
| `index-*.js` (app + React) | 624 kB | 177 kB |
| `PreviewScene-*.js` (lazy 3D engine: three+R3F+drei) | 571 kB | 153 kB |
| CSS | 4.8 kB | 1.5 kB |

The lazy engine chunk loads **only** when WebGL detection passes.

## 5. Performance Methodology (for real-device runs)

GPU numbers must be measured on real devices with the built-in sampler:

```tsx
<Shirt3DPreview enablePerfSampling onPerformanceSample={(s) => record(s)} />
```

Record: device model, OS, browser, FPS after 5 s idle, FPS while rotating,
model load-to-first-frame. Publish only measured values. Static facts already
verified by test: worst-case triangle count < 25 k; 4 shared materials;
single cached texture per pattern/colour; deterministic disposal.

## 6. Security Checks Performed

- `npm audit --omit=dev` → **0 vulnerabilities** in the runtime tree
  (react, react-dom, three, fiber, drei).
- `npm audit` (full) → 6 findings, all one root cause: `picomatch` ReDoS
  advisory in **dev-only** tooling (vite/vitest/fdir/tinyglobby); installed
  picomatch is already the latest (4.0.7); the advisory's suggested
  "fix" (downgrade vitest) would not change the picomatch version and is
  therefore not applied. Runtime users are not exposed. Re-check after
  upstream patches land.
- No secrets, tokens, or credentials anywhere in the source (grep-verified).
- No remote asset URLs are loaded at runtime; no user file uploads exist;
  no backend is introduced.
- All external/untrusted input (design config, fabric records) is validated
  by adapters before reaching the renderer.

## 7. How to Extend Tests

- New variation → add spec-consistency entry + builder existence test.
- New adapter rule → adapter suite first (pure, fast).
- UI behaviour → Testing Library on the fallback/panel components.
