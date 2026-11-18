import type { ResolvedDesign } from '../types/design';
import type { ResolvedFabric } from '../types/fabric';

export interface DesignDetailsPanelProps {
  design: ResolvedDesign;
  fabric: ResolvedFabric | null;
  adaptationNotes?: string[];
}

/**
 * Read-only summary of the configuration currently rendered.
 * Every value shown is the RESOLVED value actually driving the 3D model —
 * never the raw, possibly-invalid input.
 */
export function DesignDetailsPanel({ design, fabric, adaptationNotes = [] }: DesignDetailsPanelProps) {
  const rows: Array<[string, string]> = [
    ['Fabric', fabric ? `${fabric.record.displayName}${fabric.fromFixture ? ' (fixture data)' : ''}` : '—'],
    ['Collar', design.collarStyle],
    ['Sleeves', design.sleeveStyle],
    ['Pockets', design.pocketStyle],
    ['Pocket flaps', design.pocketFlapStyle],
    ['Cuffs', design.sleeveStyle === 'half' ? `${design.cuffStyle} (not rendered on half sleeves)` : design.cuffStyle],
    ['Buttons', design.buttonStyle],
    ['Thread', design.threadColor],
    ['Fit', `${design.fitType} (visual approximation)`],
  ];

  return (
    <aside className="s3d-details" aria-label="Design details">
      <h2 className="s3d-details__title">DESIGN DETAILS</h2>
      <dl className="s3d-details__list">
        {rows.map(([label, value]) => (
          <div key={label} className="s3d-details__row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {fabric && !fabric.record.available ? (
        <p className="s3d-details__notice" role="status">
          This fabric is currently flagged unavailable by its data source.
        </p>
      ) : null}
      {adaptationNotes.length > 0 ? (
        <details className="s3d-details__notes">
          <summary>{adaptationNotes.length} configuration notice(s)</summary>
          <ul>
            {adaptationNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </details>
      ) : null}
      <p className="s3d-disclaimer">
        3D preview is a visual approximation. Actual fabric appearance and garment fit may vary.
      </p>
    </aside>
  );
}
