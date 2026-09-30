export type EditorTab = 'edit' | 'simulation' | 'results';

export interface EditorNavigationProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
}
