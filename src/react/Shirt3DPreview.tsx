import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adaptDesignConfiguration } from '../integration/designAdapter';
import { createFabricAdapter } from '../integration/fabricAdapter';
import { defaultFabricSource } from '../integration/fixtures/fabricFixtures';
import { detectWebGLSupport } from '../core/webgl/detectWebGL';
import { isCameraPresetId } from '../core/camera/cameraPresets';
import type { CameraCommand } from './CameraRig';
import { ControlBar } from './ControlBar';
import { DesignDetailsPanel } from './DesignDetailsPanel';
import { WebGLFallback } from './WebGLFallback';
import { PreviewErrorBoundary } from './PreviewErrorBoundary';
import type { ResolvedFabric } from '../types/fabric';
import type {
  CameraPresetId,
  Shirt3DPreviewProps,
} from '../types/preview';
import './preview.css';

/**
 * Lazy loading (PERFORMANCE): the WebGL engine (three.js + R3F + drei ≈ the
 * bulk of the bundle) is code-split and fetched ONLY when the device passes
 * the WebGL check. Fallback users never download it.
 */
const PreviewScene = lazy(() =>
  import('./PreviewScene').then((m) => ({ default: m.PreviewScene })),
);

/**
 * <Shirt3DPreview /> — Module 04's public integration surface for Module 01.
 *
 * Responsibilities (and ONLY these — see ARCHITECTURE.md):
 *  1. Adapt the incoming Module 03 design configuration (validate + default).
 *  2. Resolve the Module 02 fabric through the injected FabricSource.
 *  3. Detect WebGL and either render the interactive scene or an honest
 *     fallback panel (never a fake viewer).
 *  4. Expose camera controls (front/back/left/right/zoom/reset).
 *
 * It does NOT own design editing (Module 03), fabric data (Module 02),
 * pricing (Module 05) or orders (Module 07).
 */
export function Shirt3DPreview({
  design: designInput,
  fabric: fabricInput,
  fabricSource,
  onConfigurationChange: _onConfigurationChange,
  onLoad,
  onError,
  initialCameraPreset = 'front',
  showDesignDetails = true,
  enablePerfSampling = false,
  onPerformanceSample,
  className,
}: Shirt3DPreviewProps) {
  // onConfigurationChange is reserved for hosts that embed design controls;
  // Module 04 itself is read-only, so it is accepted but never fired here.
  void _onConfigurationChange;

  // -- Design (synchronous, total function: never throws) -------------------
  const adapted = useMemo(() => adaptDesignConfiguration(designInput), [designInput]);

  // -- Fabric (async through the replaceable Module 02 boundary) ------------
  const source = fabricSource ?? defaultFabricSource;
  const [fabric, setFabric] = useState<ResolvedFabric | null>(null);
  const [fabricError, setFabricError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const adapter = createFabricAdapter(source);
    const ref = fabricInput ?? { fabricId: adapted.design.fabricId };
    adapter.resolve(ref).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setFabric(result.fabric);
        setFabricError(null);
      } else {
        setFabric(null);
        setFabricError(result.error);
        onError?.({ code: 'fabric-not-found', message: result.error });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fabricInput, source, adapted.design.fabricId, onError]);

  // -- WebGL capability -------------------------------------------------------
  const [support, setSupport] = useState(() => detectWebGLSupport());
  const retryDetection = useCallback(() => setSupport(detectWebGLSupport()), []);

  // -- Camera commands --------------------------------------------------------
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPresetId | null>(
    isCameraPresetId(initialCameraPreset) ? initialCameraPreset : 'front',
  );
  const nonce = useRef(0);
  const issue = useCallback((type: CameraCommand['type'], preset?: CameraPresetId) => {
    nonce.current += 1;
    setCameraCommand({ type, preset, nonce: nonce.current });
  }, []);

  const materialWarnings = useRef<string[]>([]);
  const handleMaterialWarnings = useCallback((warnings: string[]) => {
    materialWarnings.current = warnings;
  }, []);

  const adaptationMessages = useMemo(
    () => [
      ...adapted.notes.map((n) => n.message),
      ...(fabric?.notes ?? []),
    ],
    [adapted.notes, fabric],
  );

  const handleCanvasCreated = useCallback(
    (info: { webgl2: boolean; componentCount: number }) => {
      onLoad?.({ ...info, designId: adapted.design.designId, fabricId: adapted.design.fabricId });
    },
    [onLoad, adapted.design.designId, adapted.design.fabricId],
  );

  const handleRenderError = useCallback(
    (error: Error) => {
      onError?.({ code: 'render-failure', message: error.message, cause: error });
    },
    [onError],
  );

  const rootClass = ['s3d-root', className].filter(Boolean).join(' ');

  return (
    <section className={rootClass} data-module="3d-clothing-preview">
      <header className="s3d-header">
        <span className="s3d-header__brand">CUSTOM SHIRT STUDIO</span>
        <h1 className="s3d-header__title">3D CLOTHING PREVIEW</h1>
      </header>

      <div className="s3d-stage">
        {!support.supported ? (
          <WebGLFallback
            reason={support.reason}
            design={adapted.design}
            fabric={fabric}
            onRetry={retryDetection}
          />
        ) : fabricError ? (
          <div className="s3d-fallback" role="alert">
            <h2 className="s3d-fallback__title">Fabric unavailable</h2>
            <p>{fabricError}</p>
            <p className="s3d-fallback__reason">
              Fabric data comes from Module 02 (fabric-catalog-system). The preview cannot render
              without a resolvable fabric.
            </p>
          </div>
        ) : !fabric ? (
          <div className="s3d-loading" role="status" aria-live="polite">
            <div className="s3d-spinner" aria-hidden="true" />
            <p>Loading 3D preview…</p>
          </div>
        ) : (
          <PreviewErrorBoundary
            onError={handleRenderError}
            fallback={(error) => (
              <WebGLFallback
                reason={`Rendering error: ${error.message}`}
                design={adapted.design}
                fabric={fabric}
              />
            )}
          >
            <div className="s3d-canvas-wrap">
              <Suspense
                fallback={
                  <div className="s3d-loading" role="status" aria-live="polite">
                    <div className="s3d-spinner" aria-hidden="true" />
                    <p>Loading 3D engine…</p>
                  </div>
                }
              >
                <PreviewScene
                  design={adapted.design}
                  fabric={fabric}
                  cameraCommand={cameraCommand}
                  enablePerfSampling={enablePerfSampling}
                  onPerformanceSample={onPerformanceSample}
                  onCreated={handleCanvasCreated}
                  onMaterialWarnings={handleMaterialWarnings}
                />
              </Suspense>
            </div>
          </PreviewErrorBoundary>
        )}
      </div>

      {support.supported && !fabricError && fabric ? (
        <ControlBar
          activePreset={activePreset}
          onPreset={(preset) => {
            setActivePreset(preset);
            issue('preset', preset);
          }}
          onZoomIn={() => issue('zoom-in')}
          onZoomOut={() => issue('zoom-out')}
          onReset={() => {
            setActivePreset('front');
            issue('reset');
          }}
        />
      ) : null}

      {showDesignDetails ? (
        <DesignDetailsPanel design={adapted.design} fabric={fabric} adaptationNotes={adaptationMessages} />
      ) : null}
    </section>
  );
}
