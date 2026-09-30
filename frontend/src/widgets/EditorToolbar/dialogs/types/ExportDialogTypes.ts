export interface ExportDialogProps {
  open: boolean;
  filename: string;
  onFilenameChange: (name: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}
