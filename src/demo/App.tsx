import { useCallback, useMemo, useState } from 'react';
import { Shirt3DPreview } from '../index';
import { MOCK_DESIGNS } from '../integration/fixtures/mockDesigns';
import { FIXTURE_FABRICS } from '../integration/fixtures/fabricFixtures';
import {
  BUTTON_STYLES,
  COLLAR_STYLES,
  CUFF_STYLES,
  FIT_TYPES,
  POCKET_FLAP_STYLES,
  POCKET_STYLES,
  SLEEVE_STYLES,
  type DesignConfiguration,
} from '../types/design';
import type { PerformanceSample } from '../types/preview';
import './demo.css';

/**
 * Demo / development harness for Module 04.
 *
 * ⚠️ All selectable data below comes from LABELLED LOCAL FIXTURES
 * (src/integration/fixtures). This demo is NOT live Module 02/03 integration
 * and is never presented as such.
 */

interface DemoState extends DesignConfiguration {
  fabric_id: string;
}

const initialState: DemoState = {
  ...MOCK_DESIGNS.classicFormal,
  fabric_id: MOCK_DESIGNS.classicFormal.fabric_id ?? 'fixture-cotton-white',
};

export function App() {
  const [state, setState] = useState<DemoState>(initialState);
  const [perf, setPerf] = useState<PerformanceSample | null>(null);
  const [perfOn, setPerfOn] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  const design = useMemo<DesignConfiguration>(() => ({ ...state }), [state]);

  const logEvent = useCallback((entry: string) => {
    setEvents((prev) => [`${new Date().toLocaleTimeString()} — ${entry}`, ...prev].slice(0, 6));
  }, []);

  const set = (field: keyof DemoState, value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <main className="demo-root">
      <div className="demo-banner" role="note">
        DEMO HARNESS — all fabric/design data below is labelled local fixture data, not live
        Module 02/03 integration.
      </div>

      <Shirt3DPreview
        design={design}
        fabric={{ fabricId: state.fabric_id }}
        enablePerfSampling={perfOn}
        onPerformanceSample={setPerf}
        onLoad={(info) => logEvent(`onLoad: design=${info.designId} fabric=${info.fabricId} webgl2=${info.webgl2}`)}
        onError={(error) => logEvent(`onError: [${error.code}] ${error.message}`)}
      />

      <section className="demo-panel" aria-label="Demo design controls">
        <h2>Demo controls (fixture data)</h2>

        <div className="demo-grid">
          <label>
            Preset design
            <select
              value=""
              onChange={(e) => {
                const key = e.target.value;
                if (key && MOCK_DESIGNS[key]) {
                  setState({ ...MOCK_DESIGNS[key], fabric_id: MOCK_DESIGNS[key].fabric_id ?? initialState.fabric_id });
                }
              }}
            >
              <option value="">Load a mock design…</option>
              {Object.keys(MOCK_DESIGNS).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>

          <label>
            Fabric (fixtures)
            <select value={state.fabric_id} onChange={(e) => set('fabric_id', e.target.value)}>
              {FIXTURE_FABRICS.map((f) => (
                <option key={f.fabricId} value={f.fabricId}>
                  {f.displayName}
                </option>
              ))}
              <option value="fixture-does-not-exist">[demonstrates error] unknown fabric</option>
            </select>
          </label>

          <label>
            Collar
            <select value={state.collar_style} onChange={(e) => set('collar_style', e.target.value)}>
              {COLLAR_STYLES.map((v) => (
                <option key={v}>{v}</option>
              ))}
              <option value="wing-tip">[demonstrates fallback] wing-tip (unsupported)</option>
            </select>
          </label>

          <label>
            Sleeves
            <select value={state.sleeve_style} onChange={(e) => set('sleeve_style', e.target.value)}>
              {SLEEVE_STYLES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>

          <label>
            Pockets
            <select value={state.pocket_style} onChange={(e) => set('pocket_style', e.target.value)}>
              {POCKET_STYLES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>

          <label>
            Pocket flaps
            <select value={state.pocket_flap_style} onChange={(e) => set('pocket_flap_style', e.target.value)}>
              {POCKET_FLAP_STYLES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>

          <label>
            Cuffs
            <select value={state.cuff_style} onChange={(e) => set('cuff_style', e.target.value)}>
              {CUFF_STYLES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>

          <label>
            Buttons
            <select value={state.button_style} onChange={(e) => set('button_style', e.target.value)}>
              {BUTTON_STYLES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>

          <label>
            Fit
            <select value={state.fit_type} onChange={(e) => set('fit_type', e.target.value)}>
              {FIT_TYPES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>

          <label>
            Thread colour
            <input
              type="color"
              value={state.thread_color ?? '#d8d8d8'}
              onChange={(e) => set('thread_color', e.target.value)}
            />
          </label>

          <label>
            Button colour
            <input
              type="color"
              value={state.button_color ?? '#f4f1e8'}
              onChange={(e) => set('button_color', e.target.value)}
            />
          </label>
        </div>

        <div className="demo-perf">
          <label>
            <input type="checkbox" checked={perfOn} onChange={(e) => setPerfOn(e.target.checked)} /> FPS
            sampling
          </label>
          {perf ? (
            <span>
              {perf.fps} fps · {perf.frameMs} ms/frame (measured on this device)
            </span>
          ) : null}
        </div>

        {events.length > 0 ? (
          <div className="demo-events" aria-label="Component events">
            <h3>Events</h3>
            <ul>
              {events.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <footer className="demo-footer">
        3D preview is a visual approximation. Actual fabric appearance and garment fit may vary.
      </footer>
    </main>
  );
}
