import type { EditorTab } from '@widgets/EditorNavigation/types/EditorNavigationTypes';

export type PendingExport = {
  defaultFilename: string;
  getContent: (filename: string) => string;
};

export interface EditorToolbarProps {
  readOnly?: boolean;
  onWorkspaceChange: (tab: EditorTab) => void;
  onSave: () => Promise<void>;
  onToggleScene?: () => void;
  sceneGraphOpen?: boolean;
  showSceneToggle?: boolean;
  isSaving?: boolean;
}
