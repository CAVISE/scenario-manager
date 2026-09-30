import type { EntityCollection } from '@/store/types/sceneEntityTypes';

export interface BatchField {
  key: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  color?: boolean;
}

export interface BatchChange {
  collection: EntityCollection;
  id: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

export interface BatchPropertyFieldProps {
  field: BatchField;
  value: string | number | null;
}

export interface MultiSelectionPropertiesProps {
  readOnly?: boolean;
}

export interface DeleteSelectedObjectsResult {
  count: number;
  entryId: string;
}
