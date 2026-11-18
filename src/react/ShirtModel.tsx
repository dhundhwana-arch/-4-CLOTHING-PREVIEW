import { useEffect, useMemo } from 'react';
import { applyMaterialSet, createMaterialSet, disposeMaterialSet } from '../core/materials/materialEngine';
import { buildShirtModel, disposeShirtModel } from '../core/model/shirtModelBuilder';
import type { ResolvedDesign } from '../types/design';
import type { ResolvedFabric } from '../types/fabric';

export interface ShirtModelProps {
  design: ResolvedDesign;
  fabric: ResolvedFabric;
  onMaterialWarnings?: (warnings: string[]) => void;
  /** Fires once per built model with the real rendered-component count. */
  onModelReady?: (componentCount: number) => void;
}

/**
 * R3F binding of the procedural shirt model. Rebuilds geometry only when the
 * resolved design changes; rebuilds materials when design/fabric change.
 * All geometry and materials are disposed deterministically on cleanup.
 */
export function ShirtModel({ design, fabric, onMaterialWarnings, onModelReady }: ShirtModelProps) {
  const model = useMemo(() => buildShirtModel(design), [design]);

  useEffect(() => {
    onModelReady?.(model.components.size);
  }, [model, onModelReady]);

  const materialSet = useMemo(
    () => createMaterialSet(design, fabric),
    [design, fabric],
  );

  useEffect(() => {
    applyMaterialSet(model.root, materialSet);
    if (materialSet.warnings.length > 0) onMaterialWarnings?.(materialSet.warnings);
  }, [model, materialSet, onMaterialWarnings]);

  useEffect(
    () => () => {
      disposeMaterialSet(materialSet);
      disposeShirtModel(model);
    },
    [model, materialSet],
  );

  return <primitive object={model.root} />;
}
