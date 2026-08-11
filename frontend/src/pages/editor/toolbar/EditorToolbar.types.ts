export type PendingExport = {
  defaultFilename: string;
  getContent: (filename: string) => string;
};

export interface ExportDialogProps {
  open: boolean;
  filename: string;
  onFilenameChange: (name: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}
