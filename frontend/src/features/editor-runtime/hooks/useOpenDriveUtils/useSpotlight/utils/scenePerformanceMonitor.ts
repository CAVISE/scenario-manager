import type * as THREE from 'three';

export interface ScenePerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  pickingTimeMs: number;
  selectionTimeMs: number;
  selectionQueries: number;
  drawCalls: number;
  triangles: number;
  lines: number;
  points: number;
  geometries: number;
  textures: number;
}

export interface ScenePerformanceMonitor {
  recordFrame: (
    frameTimeMs: number,
    pickingTimeMs: number,
    info: Pick<THREE.WebGLInfo, 'render' | 'memory'>
  ) => void;
  recordSelection: (durationMs: number) => void;
  snapshot: () => ScenePerformanceMetrics;
}

const EMPTY_METRICS: ScenePerformanceMetrics = {
  fps: 0,
  frameTimeMs: 0,
  pickingTimeMs: 0,
  selectionTimeMs: 0,
  selectionQueries: 0,
  drawCalls: 0,
  triangles: 0,
  lines: 0,
  points: 0,
  geometries: 0,
  textures: 0,
};

const SAMPLE_INTERVAL_MS = 1000;

/**
 * Keeps a rolling performance sample without adding a second render loop.
 * Values are intentionally kept in memory so they can be inspected in devtools.
 */
export function createScenePerformanceMonitor(
  getNow: () => number = () => performance.now()
): ScenePerformanceMonitor {
  let sampleStartedAt = getNow();
  let frameCount = 0;
  let totalFrameTimeMs = 0;
  let totalPickingTimeMs = 0;
  let totalSelectionTimeMs = 0;
  let selectionQueries = 0;
  let metrics = { ...EMPTY_METRICS };

  const publishSample = (
    info: Pick<THREE.WebGLInfo, 'render' | 'memory'>,
    now: number
  ) => {
    const elapsedMs = Math.max(now - sampleStartedAt, 1);
    metrics = {
      fps: frameCount / (elapsedMs / 1000),
      frameTimeMs: totalFrameTimeMs / frameCount,
      pickingTimeMs: totalPickingTimeMs / frameCount,
      selectionTimeMs:
        selectionQueries === 0 ? 0 : totalSelectionTimeMs / selectionQueries,
      selectionQueries,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      lines: info.render.lines,
      points: info.render.points,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
    };
  };

  return {
    recordFrame(frameTimeMs, pickingTimeMs, info) {
      frameCount += 1;
      totalFrameTimeMs += frameTimeMs;
      totalPickingTimeMs += pickingTimeMs;

      const now = getNow();
      publishSample(info, now);

      if (now - sampleStartedAt < SAMPLE_INTERVAL_MS) return;

      sampleStartedAt = now;
      frameCount = 0;
      totalFrameTimeMs = 0;
      totalPickingTimeMs = 0;
      totalSelectionTimeMs = 0;
      selectionQueries = 0;
    },
    recordSelection(durationMs) {
      totalSelectionTimeMs += durationMs;
      selectionQueries += 1;
    },
    snapshot: () => ({ ...metrics }),
  };
}
