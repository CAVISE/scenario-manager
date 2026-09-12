import { useEditorStore } from '@/store';
import {
  entityCollections,
  getSelectedEntities,
  type EntityCollection,
  type SceneEntity,
  type SceneEntities,
} from '@/store/utils/sceneEntities';
import { flushPendingHistory } from '@editor/hooks/createEvents/createHistoryTracker/ui/createHistoryTracker';
import { getBatchFields, parseBatchValue } from './batchFields';

const collections = Object.values(entityCollections);
type Change = {
  collection: EntityCollection;
  id: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

function applyChanges(changes: Change[], direction: 'before' | 'after') {
  useEditorStore.setState((state) => {
    const update: Partial<SceneEntities> = {};
    for (const collection of collections) {
      const patches = new Map(
        changes
          .filter((change) => change.collection === collection)
          .map((change) => [change.id, change[direction]])
      );
      if (patches.size)
        Object.assign(update, {
          [collection]: state[collection].map((entity) =>
            patches.has(entity.id)
              ? { ...entity, ...patches.get(entity.id) }
              : entity
          ),
        });
    }
    return update;
  });
}

function transaction(label: string, redo: () => void, undo: () => void) {
  flushPendingHistory();
  useEditorStore.setState({ isApplyingHistory: true });
  let entryId = '';
  try {
    redo();
    entryId = useEditorStore.getState().pushHistoryEntry({ label, redo, undo });
  } finally {
    useEditorStore.setState({ isApplyingHistory: false });
  }
  return entryId;
}

export function applyBatchProperty(key: string, raw: string): boolean {
  const state = useEditorStore.getState();
  if (state.simulationSession.phase === 'running') return false;
  const items = getSelectedEntities(state);
  const field = getBatchFields(items).find(
    (candidate) => candidate.key === key
  );
  if (!field) return false;
  const value = parseBatchValue(field, raw);
  if (value === null) return false;
  const changes = items.flatMap((item) => {
    const before = (item.entity as unknown as Record<string, unknown>)[key];
    return before === value
      ? []
      : [
          {
            collection: entityCollections[item.type],
            id: item.id,
            before: { [key]: before },
            after: { [key]: value },
          },
        ];
  });
  if (!changes.length) return false;
  transaction(
    `Change ${field.label} · ${items.length} objects`,
    () => applyChanges(changes, 'after'),
    () => applyChanges(changes, 'before')
  );
  return true;
}

export function deleteSelectedObjects(): {
  count: number;
  entryId: string;
} | null {
  const state = useEditorStore.getState();
  if (state.simulationSession.phase === 'running') return null;
  const items = getSelectedEntities(state);
  if (!items.length) return null;
  const ids = new Set(items.map((item) => item.id));
  const carIds = new Set(
    items.filter((item) => item.type === 'car').map((item) => item.id)
  );
  const removed = new Map<
    EntityCollection,
    Array<{ entity: SceneEntity; index: number }>
  >();
  for (const collection of collections) {
    removed.set(
      collection,
      state[collection].flatMap((entity, index) =>
        ids.has(entity.id) || ('carId' in entity && carIds.has(entity.carId))
          ? [{ entity, index }]
          : []
      )
    );
  }
  const redo = () =>
    useEditorStore.setState((current) => {
      const update: Partial<SceneEntities> = {};
      for (const collection of collections) {
        const deletedIds = new Set(
          removed.get(collection)!.map(({ entity }) => entity.id)
        );
        Object.assign(update, {
          [collection]: current[collection].filter(
            (entity) => !deletedIds.has(entity.id)
          ),
        });
      }
      return { ...update, selectedIds: [], selectedObjects: [] };
    });
  const undo = () =>
    useEditorStore.setState((current) => {
      const update: Partial<SceneEntities> = {};
      for (const collection of collections) {
        const restored: SceneEntity[] = [...current[collection]];
        for (const { entity, index } of removed.get(collection)!) {
          if (!restored.some((item) => item.id === entity.id))
            restored.splice(Math.min(index, restored.length), 0, entity);
        }
        Object.assign(update, { [collection]: restored });
      }
      return update;
    });
  const entryId = transaction(`Delete ${items.length} objects`, redo, undo);
  return { count: items.length, entryId };
}
