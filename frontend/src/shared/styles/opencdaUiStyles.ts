export const opencdaPanelPaperSx = {
  p: 2,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.03)'
      : 'rgba(15, 23, 42, 0.04)',
} as const;

export const opencdaSectionLabelSx = {
  fontWeight: 600,
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.secondary',
} as const;

export const opencdaStackSx = { spacing: 2 } as const;
