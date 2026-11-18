import type { ResolvedDesign } from '../types/design';
import type { ResolvedFabric } from '../types/fabric';

export interface WebGLFallbackProps {
  reason?: string;
  design?: ResolvedDesign;
  fabric?: ResolvedFabric | null;
  onRetry?: () => void;
}

/**
 * Rendered when WebGL is unavailable or rendering failed.
 *
 * Honesty contract: this panel NEVER pretends a 3D viewer exists. It states
 * plainly why the preview cannot render and shows the resolved design
 * summary (text) instead. If a verified static product image is ever
 * supplied by Module 02, it may be added here with an explicit label.
 */
export function WebGLFallback({ reason, design, fabric, onRetry }: WebGLFallbackProps) {
  return (
    <div className="s3d-fallback" role="alert" aria-live="polite">
      <h2 className="s3d-fallback__title">3D preview unavailable</h2>
      <p>
        Your browser or device could not create a WebGL rendering context, so the interactive 3D
        preview cannot be displayed.
      </p>
      {reason ? <p className="s3d-fallback__reason">Details: {reason}</p> : null}
      {design ? (
        <div className="s3d-fallback__summary">
          <h3>Your design (text summary)</h3>
          <ul>
            <li>Fabric: {fabric ? fabric.record.displayName : design.fabricId}</li>
            <li>Collar: {design.collarStyle}</li>
            <li>Sleeves: {design.sleeveStyle}</li>
            <li>Pockets: {design.pocketStyle}</li>
            <li>Cuffs: {design.cuffStyle}</li>
            <li>Buttons: {design.buttonStyle}</li>
          </ul>
        </div>
      ) : null}
      {onRetry ? (
        <button type="button" className="s3d-btn" onClick={onRetry}>
          RETRY 3D PREVIEW
        </button>
      ) : (
        <p>Try a current version of Chrome, Firefox, Safari or Edge with hardware acceleration enabled.</p>
      )}
    </div>
  );
}
