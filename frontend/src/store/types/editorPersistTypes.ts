import type { EditorState } from './useEditorStoreTypes';

export type EditorPersist = Pick<
  EditorState,
  | 'cars'
  | 'RSUs'
  | 'lidars'
  | 'points'
  | 'buildings'
  | 'Scenario'
  | 'simConfig'
  | 'selectedIds'
  | 'selectedObjects'
  | 'pedestrians'
>;
