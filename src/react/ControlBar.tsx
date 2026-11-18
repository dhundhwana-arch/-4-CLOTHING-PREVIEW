import { CAMERA_PRESET_IDS, type CameraPresetId } from '../types/preview';

export interface ControlBarProps {
  activePreset: CameraPresetId | null;
  onPreset: (preset: CameraPresetId) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const PRESET_LABELS: Record<CameraPresetId, string> = {
  front: 'FRONT',
  back: 'BACK',
  left: 'LEFT',
  right: 'RIGHT',
};

/**
 * Touch-friendly camera control bar (≥44px targets, real <button>s for
 * keyboard/screen-reader access). Purely presentational.
 */
export function ControlBar({ activePreset, onPreset, onZoomIn, onZoomOut, onReset }: ControlBarProps) {
  return (
    <div className="s3d-controls" role="group" aria-label="3D preview camera controls">
      <div className="s3d-controls__row">
        {CAMERA_PRESET_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`s3d-btn${activePreset === id ? ' s3d-btn--active' : ''}`}
            aria-pressed={activePreset === id}
            onClick={() => onPreset(id)}
          >
            {PRESET_LABELS[id]}
          </button>
        ))}
      </div>
      <div className="s3d-controls__row">
        <button type="button" className="s3d-btn" aria-label="Zoom in" onClick={onZoomIn}>
          ZOOM +
        </button>
        <button type="button" className="s3d-btn" aria-label="Zoom out" onClick={onZoomOut}>
          ZOOM −
        </button>
        <button type="button" className="s3d-btn s3d-btn--reset" onClick={onReset}>
          RESET CAMERA
        </button>
      </div>
    </div>
  );
}
