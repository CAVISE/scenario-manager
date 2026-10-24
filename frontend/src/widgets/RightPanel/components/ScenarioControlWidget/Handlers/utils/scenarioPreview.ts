let canvasRef: HTMLCanvasElement | null = null;
let cachedPreview: string | null = null;
let previewGenerationInProgress = false;
let pendingPreviewCallbacks: Array<(preview: string | null) => void> = [];

const PREVIEW_MAX_DIMENSION = 400;

export function setCanvasReference(canvas: HTMLCanvasElement | null): void {
  canvasRef = canvas;
  cachedPreview = null;
}

function capturePreview(): string | null {
  if (!canvasRef) return null;
  try {
    const { width, height } = canvasRef;
    if (width === 0 || height === 0) return null;
    const scale = Math.min(1, PREVIEW_MAX_DIMENSION / Math.max(width, height));
    if (scale >= 1) return canvasRef.toDataURL('image/png');

    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const offscreen = document.createElement('canvas');
    offscreen.width = targetWidth;
    offscreen.height = targetHeight;
    const context = offscreen.getContext('2d');
    if (!context) return canvasRef.toDataURL('image/png');
    context.drawImage(canvasRef, 0, 0, targetWidth, targetHeight);
    return offscreen.toDataURL('image/png');
  } catch (error) {
    console.warn('Failed to capture preview:', error);
    return null;
  }
}

export function invalidatePreviewCache(): void {
  cachedPreview = null;
}

export function generatePreviewAsync(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!canvasRef) return resolve(null);
    if (cachedPreview) return resolve(cachedPreview);
    if (previewGenerationInProgress) {
      pendingPreviewCallbacks.push(resolve);
      return;
    }
    previewGenerationInProgress = true;
    requestAnimationFrame(() => {
      let preview: string | null = null;
      try {
        preview = capturePreview();
        if (preview) cachedPreview = preview;
      } catch (error) {
        console.warn('Failed to generate preview:', error);
      } finally {
        previewGenerationInProgress = false;
        resolve(preview);
        const callbacks = pendingPreviewCallbacks;
        pendingPreviewCallbacks = [];
        callbacks.forEach((callback) => callback(preview));
      }
    });
  });
}

export function generatePreviewSync(): string | null {
  if (!canvasRef) {
    console.warn('No canvas reference set, cannot generate preview');
    return null;
  }
  if (cachedPreview) return cachedPreview;
  const preview = capturePreview();
  if (preview) cachedPreview = preview;
  return preview;
}
