import { useEditorStore } from '@/store';

export function setStoreError(error: Error | null): void {
  useEditorStore.getState().setError(error);
}
