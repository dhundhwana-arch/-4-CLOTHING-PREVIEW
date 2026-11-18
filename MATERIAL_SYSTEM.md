# MATERIAL SYSTEM — MODULE 04

## 1. Architecture

The material engine (`src/core/materials/materialEngine.ts`) creates exactly
**four shared materials** per (design, fabric) pair — one per material slot:

| Slot | Used by | Key properties |
|---|---|---|
| `cloth-extruded` | body, pockets, flaps, collar leaves | fabric base colour, generated map, repeat 0.55 |
| `cloth-standard` | sleeves, cuffs, collar band, placket | fabric base colour, generated map, repeat 2×2 |
| `button` | all buttons | style default or `button_color`, style roughness |
| `thread` | stitching strips | `thread_color` |

All materials are `THREE.MeshStandardMaterial` (PBR): `roughness` 0.88 for
cloth, style-dependent for buttons (pearl 0.18 … standard 0.55), `metalness`
0.0–0.05. Materials are shared across meshes (never cloned per mesh) and
disposed centrally via `disposeMaterialSet`.

Join mechanism: the model builder tags every mesh with
`userData.materialSlot`; `applyMaterialSet(root, set)` binds
`mesh.material = set.materials[slot]` during traversal.

## 2. Texture Loading & Generation

**Current implementation (IMPLEMENTED):** canvas-generated 128×128 tiles:

| Pattern id | Description |
|---|---|
| `weave` | fine plain-weave alternation |
| `oxford` | 2×2 basket weave |
| `stripes` | vertical stripe pair |
| `checks` | gingham-like check + sheer lines |

- Cached by `pattern:colour:size`; `textureCacheSize()` introspects; central
  `disposeTextureCache()`.
- `colorSpace = SRGBColorSpace`, `RepeatWrapping`, `anisotropy: 4`.
- Generation happens in the material engine when `fabric.textureRef` matches
  a generated-pattern id.

**LICENSING / HONESTY:** these tiles are programmatic approximations. They
are **not photographs of real fabric** and are never presented as such. No
fabric photography exists in this repository.

**Future (PENDING — Module 02):** `textureRef` values that are not generated
pattern ids currently produce a **warning + flat-colour fallback**. Once
Module 02 publishes verified texture asset URLs, the factory gains a
`TextureLoader` branch behind the same fallback contract.

## 3. Failure Policy (never crash the preview)

| Failure | Result |
|---|---|
| No DOM canvas (SSR/tests) | factory returns `null` → flat colour |
| Canvas 2D context unavailable | `degraded` → warning + flat colour |
| Unsupported textureRef | warning + flat colour |
| Invalid fabric colour | neutral grey `#9aa0a6` + note (fabric adapter) |

## 4. UV Mapping Assumptions

- ExtrudeGeometry UVs are in shape coordinate space (~±1.0): repeat < 1
  produces correctly-scaled patterns on body/pockets.
- Cylinder/Box UVs span 0–1: repeat 2 tiles the pattern twice.
- This is a deliberate, documented approximation; per-texel density is not
  perfectly uniform across component types.

## 5. Supported Formats

- Generated: CanvasTexture (RGBA8).
- Future remote: PNG/JPEG/WebP via TextureLoader; compressed GPU formats
  (KTX2/Basis) evaluated only when the Module 02 asset pipeline exists —
  no unverified claims.

## 6. Performance Considerations

- One texture instance per pattern/colour/size (cache), shared by both cloth
  slots (cloned only to vary `repeat`).
- 128px tiles: ~64 KB GPU each worst case; a handful of tiles per session.
- No per-frame allocations in the render loop; materials rebuild only on
  design/fabric identity change.

## 7. Asset Licensing Requirements (for future real textures)

Any future fabric photography must be: (a) supplied/owned by the project or
Module 02, (b) license-compatible with MIT distribution of this module,
(c) referenced with preserved provenance metadata, and (d) labelled as a
photograph only if it genuinely is one.
