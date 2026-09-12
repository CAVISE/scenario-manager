import type { EditorTab } from '../../../EditorNavigation/types/EditorNavigationTypes';

export interface FileMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onUpload: () => void;
  readOnly: boolean;
  onSave: () => Promise<void>;
  onWorkspaceChange: (tab: EditorTab) => void;
}
export const FolderIconStyles = { marginRight: 8 } as const;
