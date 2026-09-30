import type { DeletionSnapshot } from '@/store/types/useEditorStoreTypes';

export type PushedSnapshotInfo = {
  snapshotId: string;
  label: string;
};

export type BuildSingleNodeSnapshotProps = {
  id: string;
  label: string;
};

export type { DeletionSnapshot };
