import { ReactNode } from 'react';
import { useEditorStore } from '@/store';

export interface Props {
  children: ReactNode;
}

export interface State {
  hasError: boolean;
  error: Error | null;
}

export function setStoreError(error: Error | null) {
  useEditorStore.getState().setError(error);
}
