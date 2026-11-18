# 3D MODEL SPECIFICATION — MODULE 04 Procedural Shirt

> **Scope honesty:** this is a **stylized visualization model**, not a
> professional cloth simulation. No fabric deformation, tailoring simulation,
> or garment-fit accuracy is implemented or claimed.

## 1. Why Procedural (not GLB)

The repository owns no licensed 3D shirt asset, and project rules forbid
fabricating or hot-linking assets of unclear provenance. A procedural
Three.js model provides: exact per-component control for every design
variation, zero geometry download weight, deterministic Node-side testing,
and no licensing risk. A GLB export of this parametric model can be added
later (PENDING) without changing any public contract.

## 2. Coordinate & Unit Conventions

| Convention | Value |
|---|---|
| Front direction | `+Z` (the `front` camera preset sits on +Z) |
| Garment's left side | `+X` (viewer's right when facing the front) |
| Up | `+Y` |
| Origin | vertical centre of the torso |
| Vertical extent | hem ≈ `y=-1.05`, collar top ≈ `y=+1.15` |
| Unit scale | 1 unit ≈ 30 cm, stylized proportions (not tailoring measurements) |

## 3. Component Hierarchy (stable IDs — never rename silently)

```
shirt-root (Group, name = "shirt-root")
├── shirt/body                    ExtrudeGeometry (torso outline, bevel)
├── shirt/sleeve-left             CylinderGeometry (tapered, oriented shoulder→end)
├── shirt/sleeve-right            ″
├── shirt/collar                  Group @ (0, 1.06, 0)
│   ├── shirt/collar-band         CylinderGeometry (z-scaled 1.15, oval)
│   ├── shirt/collar-leaf-left    ExtrudeGeometry (leaf flap; not for mandarin)
│   ├── shirt/collar-leaf-right   ″
│   ├── shirt/collar-button-left  CylinderGeometry (button-down only)
│   └── shirt/collar-button-right ″
├── shirt/button-panel            BoxGeometry (front placket)
├── shirt/buttons                 Group
│   └── shirt/button-0 … shirt/button-6   CylinderGeometry ×7, evenly spaced
├── shirt/cuff-left               CylinderGeometry (full sleeves only)
├── shirt/cuff-right              ″
├── shirt/cuff-left/fold-ring     CylinderGeometry (french cuffs only)
├── shirt/cuff-right/fold-ring    ″
├── shirt/pocket-left             ExtrudeGeometry (rounded rect)
├── shirt/pocket-right            ″
├── shirt/pocket-flap-left        ExtrudeGeometry (pointed pentagon | rounded rect)
├── shirt/pocket-flap-right       ″
└── shirt/stitching               Group of BoxGeometry strips
    ├── hem (front + back)
    ├── placket edges ×2
    └── shoulder seams ×2
```

All ids are enumerated in `src/core/model/components.ts`
(`SHIRT_COMPONENT_IDS`) and asserted by tests.

## 4. Geometry & Materials per Component

| Component | Geometry | Material slot | Notes |
|---|---|---|---|
| body | Extrude (shape outline, bevel 0.06/0.05) | `cloth-extruded` | Fit scale applied on x/z |
| sleeves | Tapered cylinder, 20 radial segments | `cloth-standard` | oriented via quaternion `setFromUnitVectors` |
| collar band | Cylinder, oval z-scale | `cloth-standard` | |
| collar leaves | Extrude (flat) | `cloth-extruded` | rotation.x -0.18 against chest |
| button panel | Box 0.14×1.9×0.03 | `cloth-standard` | |
| buttons | Cylinder r≈0.035 | `button` | 7 front + 2 collar tips (button-down) |
| cuffs | Cylinder | `cloth-standard` | full sleeves only |
| pockets/flaps | Extrude | `cloth-extruded` | |
| stitching | Thin boxes | `thread` | thread colour |

UVs: extruded geometry uses shape-space UVs; cylinders/boxes use standard
UVs. Texture repeat is therefore calibrated per material slot
(`SLOT_TEXTURE_REPEAT`). Normals are geometry-generated (clean); the model
carries no normal/ao maps.

## 5. Supported Variations (single source of truth: `core/model/variations.ts`)

| Aspect | Options | Geometry realization |
|---|---|---|
| Collar | `classic` `spread` `button-down` `mandarin` | band + leaf shape params; tip buttons for button-down; band-only for mandarin |
| Sleeves | `full` `half` | end point/radii; `half` sets `supportsCuffs=false` |
| Pockets | `none` `single` `double` | presence map per side |
| Pocket flaps | `none` `pointed` `rounded` | pentagon vs rounded-rect outline |
| Cuffs | `standard` `rounded` `french` | height/radius; french adds fold ring |
| Buttons | `standard` `pearl` `dark` | radius/thickness, default colour, roughness |
| Fit | `slim` `regular` `relaxed` | x/z silhouette scale 0.94 / 1.0 / 1.08 — **visual approximation only** |
| Buttons colour | any `#rrggbb` | overrides style default |
| Thread colour | any `#rrggbb` | stitching slot colour |

**Fallback policy:** an option outside these lists is rejected by the design
adapter with an `unsupported-value` note and the documented default is
rendered; the notice surfaces in the details panel. The preview never
silently renders a different style.

## 6. Polygon Budget

Worst-case configuration (double pockets, pointed flaps, button-down collar,
french cuffs) is test-asserted at **< 25,000 triangles**; typical
configurations are well below. Radial segments are capped at 20.

## 7. Asset Loading & Reuse

Geometry is built per resolved design and cached by React `useMemo` on the
design identity; disposal via `disposeShirtModel`. No network fetch, no
external asset dependency, no CDN.
