import type { EditorState } from './useEditorStoreTypes';

export interface EntityCollectionByKind {
  car: 'cars';
  rsu: 'RSUs';
  building: 'buildings';
  pedestrian: 'pedestrians';
  point: 'points';
  lidar: 'lidars';
}

export type EntityKind = keyof EntityCollectionByKind;
export type EntityCollection = EntityCollectionByKind[EntityKind];
export type SceneEntities = Pick<EditorState, EntityCollection>;
export type SceneEntity = SceneEntities[EntityCollection][number];

export interface EntityItem {
  id: string;
  type: EntityKind;
  label: string;
  entity: SceneEntity;
}
