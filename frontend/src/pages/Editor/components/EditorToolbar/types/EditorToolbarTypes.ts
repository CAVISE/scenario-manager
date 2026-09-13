export type PendingExport = {
  defaultFilename: string;
  getContent: (filename: string) => string;
};
export const EditorToolbarStyles = {
  position: 'absolute',
  top: 10,
  left: 88,
  display: 'flex',
  gap: 2,
  alignItems: 'start',
  padding: 4,
  background: 'var(--workspace-surface)',
  border: '1px solid var(--workspace-border)',
  borderRadius: 6,
  boxShadow: 'var(--workspace-shadow)',
  zIndex: 10,
} as const;
export const EditorToolbarDivStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: '0 2px',
} as const;
export const EditorToolbarGroupEndStyles = {
  ...EditorToolbarDivStyles,
  paddingRight: 6,
  marginRight: 4,
  borderRight: '1px solid var(--workspace-border)',
} as const;
