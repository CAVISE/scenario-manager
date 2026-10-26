export {};

declare global {
  interface Window {
    editorModals?: {
      openTelemetry: () => void;
      openSimulation: () => void;
      openMapPicker: () => void;
      selectMap: (mapName: string, onSuccess?: () => void) => void;
    };
  }
}
