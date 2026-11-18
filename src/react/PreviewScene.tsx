import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { CameraRig, type CameraCommand } from './CameraRig';
import { ShirtModel } from './ShirtModel';
import { PerfMonitor } from './PerfMonitor';
import type { ResolvedDesign } from '../types/design';
import type { ResolvedFabric } from '../types/fabric';
import type { PerformanceSample, PreviewLoadInfo } from '../types/preview';

export interface PreviewSceneProps {
  design: ResolvedDesign;
  fabric: ResolvedFabric;
  cameraCommand: CameraCommand | null;
  enablePerfSampling?: boolean;
  onPerformanceSample?: (sample: PerformanceSample) => void;
  onCreated?: (info: Omit<PreviewLoadInfo, 'designId' | 'fabricId'>) => void;
  onMaterialWarnings?: (warnings: string[]) => void;
}

/**
 * The WebGL canvas. Rendered only after `detectWebGLSupport()` passes and
 * both design + fabric have resolved (see Shirt3DPreview).
 *
 * Mobile strategy: DPR clamped to [1, 2], antialias on (cheap at clamped
 * DPR for this low-poly model), no post-processing, soft contact shadow
 * only (no shadow-map passes).
 */
export function PreviewScene({
  design,
  fabric,
  cameraCommand,
  enablePerfSampling = false,
  onPerformanceSample,
  onCreated,
  onMaterialWarnings,
}: PreviewSceneProps) {
  const componentCount = useRef(0);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.35, 3.1], fov: 42, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
      onCreated={({ gl }) => {
        const capabilities = (gl as { capabilities?: { isWebGL2?: boolean } }).capabilities;
        onCreated?.({
          webgl2: capabilities?.isWebGL2 !== false,
          componentCount: componentCount.current,
        });
      }}
    >
      {/* Neutral studio lighting: soft key + fill + rim. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 4]} intensity={1.15} />
      <directionalLight position={[-3, 2, -3]} intensity={0.4} />
      <directionalLight position={[0, -2, 2]} intensity={0.15} />

      <Suspense fallback={null}>
        <ShirtModel
          design={design}
          fabric={fabric}
          onMaterialWarnings={onMaterialWarnings}
          onModelReady={(count) => {
            componentCount.current = count;
          }}
        />
        <ContactShadows position={[0, -1.35, 0]} opacity={0.32} scale={6} blur={2.6} far={3} />
      </Suspense>

      <CameraRig command={cameraCommand} />
      {enablePerfSampling && onPerformanceSample ? <PerfMonitor onSample={onPerformanceSample} /> : null}
    </Canvas>
  );
}
