export interface WorkspacePreferences {
  theme: 'light' | 'dark' | 'system';
  focusOnSelection: boolean;
  showSelectionOutline: boolean;
  recentScenarioIds: string[];
  update: (
    patch: Partial<
      Pick<
        WorkspacePreferences,
        'theme' | 'focusOnSelection' | 'showSelectionOutline'
      >
    >
  ) => void;
  recordOpened: (id: string) => void;
}
