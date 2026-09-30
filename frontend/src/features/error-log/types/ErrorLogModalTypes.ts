import type { ErrorLogEntry } from '@/store/types/useEditorStoreTypes';

export interface ErrorLogModalProps {
  open: boolean;
  onClose: () => void;
}

export interface ErrorEntryProps {
  entry: ErrorLogEntry;
}
