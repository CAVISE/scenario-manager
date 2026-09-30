import type { EditorTab } from '@widgets/EditorNavigation/types/EditorNavigationTypes';

export interface FileMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onUpload: () => void;
  readOnly: boolean;
  onSave: () => Promise<void>;
  onWorkspaceChange: (tab: EditorTab) => void;
}
