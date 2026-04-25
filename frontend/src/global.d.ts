export {};

declare global {
  interface Window {
    editorModals: {
      openTelemetry: () => void;
      openSimulation: () => void;
    };
  }
}
