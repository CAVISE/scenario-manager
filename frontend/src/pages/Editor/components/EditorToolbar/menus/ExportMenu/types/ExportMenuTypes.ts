export interface ExportMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  openExportDialog: (
    filename: string,
    getContent: (filename: string) => string,
  ) => void;
}
