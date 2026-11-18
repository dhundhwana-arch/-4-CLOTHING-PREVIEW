import * as THREE from 'three';
import {
  COMPONENT_MATERIAL_SLOT,
  SHIRT_ROOT_NAME,
  type ShirtComponentId,
} from './components';
import {
  BUTTON_GEOMETRY,
  COLLAR_GEOMETRY,
  CUFF_GEOMETRY,
  FIT_SCALE,
  FRONT_BUTTON_COUNT,
  POCKET_FLAP_GEOMETRY,
  POCKET_GEOMETRY,
  RADIAL_SEGMENTS,
  SLEEVE_GEOMETRY,
} from './variations';
import type { ResolvedDesign } from '../../types/design';

/**
 * Procedural parametric shirt model.
 *
 * Why procedural (not GLB): the repository owns no licensed 3D shirt asset,
 * and the project rules forbid fabricating or hot-linking assets of unclear
 * provenance. Parametric geometry additionally gives exact per-component
 * control for every design variation, ships zero geometry bytes over the
 * network, and is fully unit-testable in Node. See 3D_MODEL_SPECIFICATION.md.
 *
 * Model space conventions:
 *  - +Z is the shirt FRONT (camera "front" preset sits on +Z).
 *  - +X is the garment's LEFT side (viewer's right when facing the front).
 *  - Origin is the vertical centre of the torso; hem ≈ y=-1.05, collar ≈ y=+1.15.
 *  - 1 unit ≈ 30 cm (stylized proportions; not a tailoring measurement).
 */

export interface BuiltShirtModel {
  /** Root group; add to the scene. Name = SHIRT_ROOT_NAME. */
  root: THREE.Group;
  /** Stable-id lookup of every rendered component (only existing ones). */
  components: Map<ShirtComponentId, THREE.Object3D>;
  /** All geometries created, for deterministic disposal. */
  geometries: THREE.BufferGeometry[];
  /** Front button meshes (count = FRONT_BUTTON_COUNT). */
  frontButtons: THREE.Mesh[];
}

export interface ShirtModelBuilderOptions {
  radialSegments?: number;
}

const SHOULDER_X = 0.75;
const SHOULDER_Y = 1.0;
const TORSO_DEPTH = 0.5;
const TORSO_FRONT_Z = TORSO_DEPTH / 2 + 0.06; // includes bevel
const CHEST_POCKET_Y = 0.32;
const CHEST_POCKET_X = 0.38;

/** Torso outline: shoulders → neck dip → chest → waist → hem. */
function buildTorsoShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-SHOULDER_X, SHOULDER_Y); // left shoulder tip
  s.lineTo(-0.28, 1.02); // neck left
  s.quadraticCurveTo(0, 0.86, 0.28, 1.02); // neck opening dip
  s.lineTo(SHOULDER_X, SHOULDER_Y); // right shoulder tip
  s.lineTo(0.72, 0.45); // chest right
  s.lineTo(0.66, -0.1); // waist right
  s.lineTo(0.75, -1.05); // hem right
  s.lineTo(-0.75, -1.05); // hem left
  s.lineTo(-0.66, -0.1); // waist left
  s.lineTo(-0.72, 0.45); // chest left
  s.closePath();
  return s;
}

/** Rounded rectangle outline (for pockets / flaps / placket). */
export function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const s = new THREE.Shape();
  s.moveTo(-w + r, -h);
  s.lineTo(w - r, -h);
  s.quadraticCurveTo(w, -h, w, -h + r);
  s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h);
  s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r);
  s.quadraticCurveTo(-w, -h, -w + r, -h);
  s.closePath();
  return s;
}

/** Pentagon outline for pointed pocket flaps (flat top, pointed bottom). */
function pointedFlapShape(width: number, height: number): THREE.Shape {
  const w = width / 2;
  const h = height / 2;
  const s = new THREE.Shape();
  s.moveTo(-w, h);
  s.lineTo(w, h);
  s.lineTo(w, -h * 0.2);
  s.lineTo(0, -h);
  s.lineTo(-w, -h * 0.2);
  s.closePath();
  return s;
}

function extrude(shape: THREE.Shape, depth: number, bevel = true): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
    curveSegments: 8,
  });
}

/** Orient a Y-aligned mesh so +Y points `from → to`, centred between them. */
function orientBetween(mesh: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3): void {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const dir = from.clone().sub(to).normalize();
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
}

export function buildShirtModel(
  design: ResolvedDesign,
  options: ShirtModelBuilderOptions = {},
): BuiltShirtModel {
  const radial = options.radialSegments ?? RADIAL_SEGMENTS;
  const geometries: THREE.BufferGeometry[] = [];
  const components = new Map<ShirtComponentId, THREE.Object3D>();
  const frontButtons: THREE.Mesh[] = [];

  const track = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  const register = (id: ShirtComponentId, obj: THREE.Object3D): THREE.Object3D => {
    obj.name = id;
    components.set(id, obj);
    return obj;
  };

  const slotOf = (id: ShirtComponentId) => COMPONENT_MATERIAL_SLOT[id];

  const root = new THREE.Group();
  root.name = SHIRT_ROOT_NAME;

  const meshOf = (
    id: ShirtComponentId,
    geometry: THREE.BufferGeometry,
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.materialSlot = slotOf(id);
    mesh.userData.componentId = id;
    return mesh as THREE.Mesh;
  };

  // ---- Body ---------------------------------------------------------------
  const bodyGeo = track(extrude(buildTorsoShape(), TORSO_DEPTH));
  bodyGeo.center();
  const body = meshOf('shirt/body', bodyGeo);
  const fit = FIT_SCALE[design.fitType];
  body.scale.set(fit.x, 1, fit.z);
  register('shirt/body', body);
  root.add(body);

  // ---- Sleeves ------------------------------------------------------------
  const sleeveSpec = SLEEVE_GEOMETRY[design.sleeveStyle];
  const sleeveFrom = new THREE.Vector3(0, 0, 0);
  const sleeveLength = Math.hypot(sleeveSpec.endX - SHOULDER_X, sleeveSpec.endY - SHOULDER_Y);

  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? 1 : -1;
    const from = sleeveFrom.clone().set(SHOULDER_X * sign * fit.x, SHOULDER_Y, 0);
    const to = sleeveFrom.clone().set(sleeveSpec.endX * sign * fit.x, sleeveSpec.endY, 0);
    const sleeveGeo = track(
      new THREE.CylinderGeometry(
        sleeveSpec.radiusBottom,
        sleeveSpec.radiusTop,
        sleeveLength,
        radial,
        1,
        false,
      ),
    );
    const sleeve = meshOf(`shirt/sleeve-${side}`, sleeveGeo);
    orientBetween(sleeve, from, to);
    register(`shirt/sleeve-${side}`, sleeve);
    root.add(sleeve);
  }

  // ---- Cuffs (full sleeves only) ------------------------------------------
  if (sleeveSpec.supportsCuffs) {
    const cuffSpec = CUFF_GEOMETRY[design.cuffStyle];
    for (const side of ['left', 'right'] as const) {
      const sign = side === 'left' ? 1 : -1;
      const end = new THREE.Vector3(sleeveSpec.endX * sign * fit.x, sleeveSpec.endY, 0);
      const dir = new THREE.Vector3(
        (sleeveSpec.endX - SHOULDER_X) * sign,
        sleeveSpec.endY - SHOULDER_Y,
        0,
      ).normalize();
      const cuffFrom = end.clone();
      const cuffTo = end.clone().add(dir.clone().multiplyScalar(cuffSpec.height));
      const cuffGeo = track(
        new THREE.CylinderGeometry(cuffSpec.radius, sleeveSpec.radiusBottom, cuffSpec.height, radial, 1),
      );
      const cuff = meshOf(`shirt/cuff-${side}`, cuffGeo);
      orientBetween(cuff, cuffFrom, cuffTo);
      register(`shirt/cuff-${side}`, cuff);
      root.add(cuff);

      if (cuffSpec.hasFoldRing) {
        const ringGeo = track(
          new THREE.CylinderGeometry(cuffSpec.radius + 0.005, cuffSpec.radius + 0.005, 0.03, radial, 1),
        );
        const ring = meshOf(`shirt/cuff-${side}`, ringGeo);
        const ringFrom = cuffFrom.clone().add(dir.clone().multiplyScalar(cuffSpec.height * 0.45));
        const ringTo = ringFrom.clone().add(dir.clone().multiplyScalar(0.03));
        orientBetween(ring, ringFrom, ringTo);
        ring.name = `shirt/cuff-${side}/fold-ring`;
        cuff.add(new THREE.Group()); // keep hierarchy explicit
        root.add(ring);
      }
    }
  }

  // ---- Collar -------------------------------------------------------------
  const collarSpec = COLLAR_GEOMETRY[design.collarStyle];
  const collar = new THREE.Group();
  register('shirt/collar', collar);
  collar.position.set(0, 1.06, 0);
  root.add(collar);

  const bandGeo = track(
    new THREE.CylinderGeometry(0.3, 0.32, collarSpec.bandHeight, radial, 1, false),
  );
  const band = meshOf('shirt/collar-band', bandGeo);
  band.scale.set(1, 1, 1.15);
  register('shirt/collar-band', band);
  collar.add(band);

  if (collarSpec.hasLeaves) {
    for (const side of ['left', 'right'] as const) {
      const sign = side === 'left' ? 1 : -1;
      // Leaf flap: hangs down the chest front from the collar band.
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.lineTo(0.16 * sign, -0.03);
      leafShape.lineTo(collarSpec.leafTipX * sign, collarSpec.leafTipY);
      leafShape.lineTo(0.06 * sign, collarSpec.leafTipY * 0.85);
      leafShape.closePath();
      const leafGeo = track(extrude(leafShape, 0.025, false));
      const leaf = meshOf(`shirt/collar-leaf-${side}`, leafGeo);
      leaf.position.set(0, -0.04, 0.3);
      leaf.rotation.x = -0.18;
      register(`shirt/collar-leaf-${side}`, leaf);
      collar.add(leaf);

      if (collarSpec.hasTipButtons) {
        const tipButtonGeo = track(new THREE.CylinderGeometry(0.025, 0.025, 0.015, 12, 1));
        const tipButton = meshOf(`shirt/collar-button-${side}`, tipButtonGeo);
        tipButton.position.set(collarSpec.leafTipX * sign * 0.9, collarSpec.leafTipY * 0.85 - 0.04, 0.335);
        tipButton.rotation.x = Math.PI / 2 - 0.18;
        register(`shirt/collar-button-${side}`, tipButton);
        collar.add(tipButton);
      }
    }
  }

  // ---- Front button panel (placket) ---------------------------------------
  const placketGeo = track(new THREE.BoxGeometry(0.14, 1.9, 0.03));
  const placket = meshOf('shirt/button-panel', placketGeo);
  placket.position.set(0, -0.01, TORSO_FRONT_Z + 0.005);
  register('shirt/button-panel', placket);
  root.add(placket);

  // ---- Front buttons --------------------------------------------------------
  const buttonSpec = BUTTON_GEOMETRY[design.buttonStyle];
  const buttons = new THREE.Group();
  register('shirt/buttons', buttons);
  root.add(buttons);
  const firstButtonY = 0.82;
  const lastButtonY = -0.9;
  for (let i = 0; i < FRONT_BUTTON_COUNT; i += 1) {
    const t = i / Math.max(1, FRONT_BUTTON_COUNT - 1);
    const y = firstButtonY + (lastButtonY - firstButtonY) * t;
    const buttonGeo = track(
      new THREE.CylinderGeometry(buttonSpec.radius, buttonSpec.radius, buttonSpec.thickness, 14, 1),
    );
    const button = meshOf('shirt/buttons', buttonGeo);
    button.name = `shirt/button-${i}`;
    button.position.set(0, y, TORSO_FRONT_Z + 0.03);
    button.rotation.x = Math.PI / 2;
    buttons.add(button);
    frontButtons.push(button);
  }

  // ---- Pockets + flaps ------------------------------------------------------
  const pocketSpec = POCKET_GEOMETRY[design.pocketStyle];
  const flapSpec = POCKET_FLAP_GEOMETRY[design.pocketFlapStyle];
  const pocketWidth = 0.34;
  const pocketHeight = 0.4;

  for (const side of ['left', 'right'] as const) {
    if (!pocketSpec[side]) continue;
    const sign = side === 'left' ? 1 : -1;
    const pocketGeo = track(extrude(roundedRectShape(pocketWidth, pocketHeight, 0.04), 0.03, false));
    const pocket = meshOf(`shirt/pocket-${side}`, pocketGeo);
    pocket.position.set(CHEST_POCKET_X * sign * fit.x, CHEST_POCKET_Y, TORSO_FRONT_Z + 0.002);
    register(`shirt/pocket-${side}`, pocket);
    root.add(pocket);

    if (flapSpec.hasFlap && flapSpec.outline) {
      const flapShape =
        flapSpec.outline === 'pointed'
          ? pointedFlapShape(pocketWidth + 0.03, 0.16)
          : roundedRectShape(pocketWidth + 0.03, 0.14, 0.05);
      const flapGeo = track(extrude(flapShape, 0.028, false));
      const flap = meshOf(`shirt/pocket-flap-${side}`, flapGeo);
      flap.position.set(
        CHEST_POCKET_X * sign * fit.x,
        CHEST_POCKET_Y + pocketHeight / 2 + 0.05,
        TORSO_FRONT_Z + 0.004,
      );
      flap.rotation.x = -0.1;
      register(`shirt/pocket-flap-${side}`, flap);
      root.add(flap);
    }
  }

  // ---- Stitching (thread colour) -------------------------------------------
  const stitching = new THREE.Group();
  register('shirt/stitching', stitching);
  root.add(stitching);

  const addStitch = (width: number, height: number, x: number, y: number, z: number): void => {
    const stitchGeo = track(new THREE.BoxGeometry(width, height, 0.012));
    const stitch = meshOf('shirt/stitching', stitchGeo);
    stitch.position.set(x, y, z);
    stitching.add(stitch);
  };

  // Hem stitch (front + back)
  addStitch(1.42 * fit.x, 0.02, 0, -0.98, TORSO_FRONT_Z * fit.z + 0.004);
  addStitch(1.42 * fit.x, 0.02, 0, -0.98, -TORSO_FRONT_Z * fit.z - 0.004);
  // Placket edge stitches
  addStitch(0.015, 1.82, -0.085, -0.01, TORSO_FRONT_Z + 0.012);
  addStitch(0.015, 1.82, 0.085, -0.01, TORSO_FRONT_Z + 0.012);
  // Shoulder seam stitches
  addStitch(0.42, 0.018, -0.52, 1.005, 0);
  addStitch(0.42, 0.018, 0.52, 1.005, 0);

  return { root, components, geometries, frontButtons };
}

/** Deterministically dispose every geometry the builder created. */
export function disposeShirtModel(model: BuiltShirtModel): void {
  for (const geometry of model.geometries) {
    geometry.dispose();
  }
  model.geometries.length = 0;
  model.components.clear();
  model.frontButtons.length = 0;
}
