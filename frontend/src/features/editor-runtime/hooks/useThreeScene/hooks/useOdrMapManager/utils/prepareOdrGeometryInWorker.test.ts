import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepareOdrGeometryInWorker } from './prepareOdrGeometryInWorker';
import type { PrepareOdrGeometryResponse } from '@editor/types/odrGeometryTypes';

class WorkerMock {
  static instances: WorkerMock[] = [];
  readonly listeners = new Map<string, EventListener>();
  readonly terminate = vi.fn();
  readonly postMessage = vi.fn();

  constructor() {
    WorkerMock.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener): void {
    this.listeners.set(type, listener);
  }

  removeEventListener(type: string): void {
    this.listeners.delete(type);
  }

  dispatchMessage(data: PrepareOdrGeometryResponse): void {
    this.listeners.get('message')?.(new MessageEvent('message', { data }));
  }
}

afterEach(() => {
  WorkerMock.instances = [];
  vi.unstubAllGlobals();
});

describe('prepareOdrGeometryInWorker', () => {
  it('resolves prepared geometry and terminates the worker', async () => {
    vi.stubGlobal('Worker', WorkerMock);
    const geometry = {
      reflinePositions: new Float32Array(),
      reflineIndices: new Uint32Array(),
      lanes: {} as never,
      roadmarks: {} as never,
    };

    const result = prepareOdrGeometryInWorker({
      xodr: '<OpenDRIVE />',
      resolution: 2,
    });
    const worker = WorkerMock.instances[0];
    worker.dispatchMessage({ type: 'success', geometry });

    await expect(result).resolves.toBe(geometry);
    expect(worker.postMessage).toHaveBeenCalledWith({
      xodr: '<OpenDRIVE />',
      resolution: 2,
    });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('terminates the active worker when preparation is cancelled', async () => {
    vi.stubGlobal('Worker', WorkerMock);
    const controller = new AbortController();
    const result = prepareOdrGeometryInWorker(
      { xodr: '<OpenDRIVE />', resolution: 2 },
      controller.signal
    );
    const worker = WorkerMock.instances[0];

    controller.abort();

    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
