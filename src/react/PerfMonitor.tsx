import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PerformanceSample } from '../types/preview';

export interface PerfMonitorProps {
  onSample: (sample: PerformanceSample) => void;
  /** Emit at most one sample per interval. Default 1000ms. */
  intervalMs?: number;
}

/**
 * Opt-in FPS sampler (disabled by default). Reports measured, real frame
 * timings only — never synthetic numbers. Used for honest perf documentation
 * (TESTING.md) and available to hosts via `onPerformanceSample`.
 */
export function PerfMonitor({ onSample, intervalMs = 1000 }: PerfMonitorProps) {
  const frames = useRef(0);
  const elapsed = useRef(0);
  const lastFps = useRef(0);

  useFrame((_, delta) => {
    frames.current += 1;
    elapsed.current += delta * 1000;
    if (elapsed.current >= intervalMs && frames.current > 0) {
      const fps = (frames.current / elapsed.current) * 1000;
      // Light smoothing so hosts see a stable signal, not jitter.
      lastFps.current = lastFps.current === 0 ? fps : lastFps.current * 0.6 + fps * 0.4;
      onSample({
        fps: Math.round(lastFps.current * 10) / 10,
        frameMs: Math.round((elapsed.current / frames.current) * 100) / 100,
        timestamp: Date.now(),
      });
      frames.current = 0;
      elapsed.current = 0;
    }
  });

  return null;
}
