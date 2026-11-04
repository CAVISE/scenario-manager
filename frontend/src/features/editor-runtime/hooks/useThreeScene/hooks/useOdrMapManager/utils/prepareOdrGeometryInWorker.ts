import type {
  PreparedOdrGeometry,
  PrepareOdrGeometryRequest,
  PrepareOdrGeometryResponse,
} from '@editor/types/odrGeometryTypes';

export function prepareOdrGeometryInWorker(
  request: PrepareOdrGeometryRequest,
  signal?: AbortSignal
): Promise<PreparedOdrGeometry> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(
        new DOMException(
          'OpenDRIVE geometry preparation was cancelled',
          'AbortError'
        )
      );
      return;
    }

    const worker = new Worker(
      new URL('../workers/odrGeometry.worker.ts', import.meta.url),
      { type: 'classic' }
    );

    const cleanup = () => {
      signal?.removeEventListener('abort', abort);
      worker.terminate();
    };
    const abort = () => {
      cleanup();
      reject(
        new DOMException(
          'OpenDRIVE geometry preparation was cancelled',
          'AbortError'
        )
      );
    };

    signal?.addEventListener('abort', abort, { once: true });
    worker.addEventListener(
      'message',
      ({ data }: MessageEvent<PrepareOdrGeometryResponse>) => {
        cleanup();
        if (data.type === 'success') {
          resolve(data.geometry);
          return;
        }
        reject(new Error(data.message));
      },
      { once: true }
    );
    worker.addEventListener(
      'error',
      (event) => {
        cleanup();
        reject(event.error ?? new Error(event.message));
      },
      { once: true }
    );
    worker.postMessage(request);
  });
}
