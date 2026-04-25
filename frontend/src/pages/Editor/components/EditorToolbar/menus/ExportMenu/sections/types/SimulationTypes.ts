export const ListSubheaderStyles = {
  lineHeight: '28px',
  fontSize: 11,
  color: 'text.disabled',
} as const;
export const DownloadIconStyles = { marginRight: 8 } as const;
export interface SimulatorProps {
  openExportDialog: (filename: string, contentGenerator: () => string) => void;
}
