export type PendingExport = {
  defaultFilename: string;
  getContent: () => string;
};
export const EditorToolbarStyles = {
  position: 'absolute',
  top: 10,
  left: 10,
  display: 'flex',
  gap: 10,
  alignItems: 'start',
  zIndex: 10,
} as const;
export const EditorToolbarDivStyles = {
  background: 'rgba(255,255,255,0.8)',
  borderRadius: 4,
  padding: 4,
} as const;
