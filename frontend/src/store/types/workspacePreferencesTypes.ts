export interface WorkspacePreferences {
  theme: 'light' | 'dark' | 'system';
  focusOnSelection: boolean;
  showSelectionOutline: boolean;
  showGrid: boolean;
  showRoutes: boolean;
  showLidarCoverage: boolean;
  snapToGrid: boolean;
  snapToRoad: boolean;
  gridSnapStep: number;
  snapRotation: boolean;
  rotationSnapDegrees: number;
  duplicateOffset: number;
  alignVehiclesToRoute: boolean;
  reduceVisualLoad: boolean;
  compactEditor: boolean;
  sceneGraphOpen: boolean;
  rightPanelCollapsed: boolean;
  scenePanelWidth: number;
  contextPanelWidth: number;
  recentScenarioIds: string[];
  update: (
    patch: Partial<
      Pick<
        WorkspacePreferences,
        | 'theme'
        | 'focusOnSelection'
        | 'showSelectionOutline'
        | 'showGrid'
        | 'showRoutes'
        | 'showLidarCoverage'
        | 'snapToGrid'
        | 'snapToRoad'
        | 'gridSnapStep'
        | 'snapRotation'
        | 'rotationSnapDegrees'
        | 'duplicateOffset'
        | 'alignVehiclesToRoute'
        | 'reduceVisualLoad'
        | 'compactEditor'
        | 'sceneGraphOpen'
        | 'rightPanelCollapsed'
        | 'scenePanelWidth'
        | 'contextPanelWidth'
      >
    >
  ) => void;
  recordOpened: (id: string) => void;
}
