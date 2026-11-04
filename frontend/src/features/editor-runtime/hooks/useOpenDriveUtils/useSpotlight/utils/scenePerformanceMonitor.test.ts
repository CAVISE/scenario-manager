import { describe, expect, it } from 'vitest';
import type * as THREE from 'three';
import {
  createScenePerformanceMonitor,
  type ScenePerformanceMetrics,
} from './scenePerformanceMonitor';

const rendererInfo = {
  render: {
    frame: 0,
    calls: 12,
    triangles: 3400,
    lines: 6,
    points: 2,
  },
  memory: {
    geometries: 8,
    textures: 3,
  },
} satisfies Pick<THREE.WebGLInfo, 'render' | 'memory'>;

describe('createScenePerformanceMonitor', () => {
  it('reports frame, picking, and renderer metrics over a rolling sample', () => {
    let now = 0;
    const monitor = createScenePerformanceMonitor(() => now);

    now = 500;
    monitor.recordFrame(12, 3, rendererInfo);
    now = 1000;
    monitor.recordFrame(8, 1, rendererInfo);

    expect(monitor.snapshot()).toEqual<ScenePerformanceMetrics>({
      fps: 2,
      frameTimeMs: 10,
      pickingTimeMs: 2,
      selectionTimeMs: 0,
      selectionQueries: 0,
      drawCalls: 12,
      triangles: 3400,
      lines: 6,
      points: 2,
      geometries: 8,
      textures: 3,
    });
  });

  it('returns a copy so callers cannot mutate collected metrics', () => {
    const monitor = createScenePerformanceMonitor(() => 0);
    monitor.recordFrame(10, 0, rendererInfo);

    const snapshot = monitor.snapshot();
    snapshot.fps = 0;

    expect(monitor.snapshot().fps).toBeGreaterThan(0);
  });

  it('reports average selection-raycast time for the current sample', () => {
    const monitor = createScenePerformanceMonitor(() => 0);
    monitor.recordSelection(2);
    monitor.recordSelection(4);
    monitor.recordFrame(1, 0, rendererInfo);

    expect(monitor.snapshot()).toMatchObject({
      selectionTimeMs: 3,
      selectionQueries: 2,
    });
  });
});
