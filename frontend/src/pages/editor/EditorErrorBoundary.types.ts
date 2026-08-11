import { ReactNode } from 'react';

export interface Props {
  children: ReactNode;
}

export interface State {
  hasError: boolean;
  error: Error | null;
}

export function setStoreError(error: Error | null) {
  import('../../store').then(({ useEditorStore }) => {
    useEditorStore.getState().setError(error);
  });
}
