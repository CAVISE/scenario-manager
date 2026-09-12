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
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(219,225,232,0.9)',
  borderRadius: 6,
  boxShadow: '0 4px 14px rgba(21,35,49,0.12)',
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
  borderRight: '1px solid #e5e7eb',
} as const;
