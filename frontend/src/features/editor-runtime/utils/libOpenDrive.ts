import type { LibOpenDriveGlobal } from '../types/editorTypes';

function getGlobalLibOpenDrive(): LibOpenDriveGlobal | undefined {
  const globalScope = globalThis as Record<string, unknown>;
  if (typeof globalScope['libOpenDrive'] === 'function') {
    return globalScope['libOpenDrive'] as LibOpenDriveGlobal;
  }
  return undefined;
}

export function libOpenDrive(): Promise<unknown> {
  const availableModule = getGlobalLibOpenDrive();
  if (availableModule) return availableModule();

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      const loadedModule = getGlobalLibOpenDrive();
      if (loadedModule) {
        clearInterval(interval);
        resolve(loadedModule());
        return;
      }
      attempts += 1;
      if (attempts >= 100) {
        clearInterval(interval);
        reject(
          new Error(
            'libOpenDrive not available. Make sure ModuleOpenDrive.js is loaded via <script> in index.html'
          )
        );
      }
    }, 50);
  });
}
