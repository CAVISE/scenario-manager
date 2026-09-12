import type { EditorState } from '../types/useEditorStoreTypes';

export const entityCollections = {
  car: 'cars',
  rsu: 'RSUs',
  building: 'buildings',
  pedestrian: 'pedestrians',
  point: 'points',
  lidar: 'lidars',
} as const;

export type EntityKind = keyof typeof entityCollections;
export type EntityCollection = (typeof entityCollections)[EntityKind];
export type SceneEntities = Pick<EditorState, EntityCollection>;
export type SceneEntity = SceneEntities[EntityCollection][number];
export type EntityItem = {
  id: string;
  type: EntityKind;
  label: string;
  entity: SceneEntity;
};

const labels: Record<EntityKind, string> = {
  car: 'Vehicle',
  rsu: 'RSU',
  building: 'Building',
  pedestrian: 'Pedestrian',
  point: 'Waypoint',
  lidar: 'Lidar',
};

export function getEntityItems(state: SceneEntities): EntityItem[] {
  return (Object.keys(entityCollections) as EntityKind[]).flatMap((type) =>
    state[entityCollections[type]].map((entity, index) => ({
      id: entity.id,
      type,
      label: `${labels[type]} ${String(index + 1).padStart(2, '0')}`,
      entity,
    }))
  );
}

export function getSelectedEntities(
  state: SceneEntities & { selectedIds: string[] }
): EntityItem[] {
  const byId = new Map(getEntityItems(state).map((item) => [item.id, item]));
  return [...new Set(state.selectedIds)].flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

export function resolveSelection(state: SceneEntities, ids: string[]) {
  const byId = new Map(getEntityItems(state).map((item) => [item.id, item]));
  return [...new Set(ids)].flatMap((id) => {
    const item = byId.get(id);
    return item ? [{ id, type: item.type }] : [];
  });
}
