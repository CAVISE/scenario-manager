import { useEditorStore } from '@/store';
import type { EditorState } from '@/store/types/useEditorStoreTypes';
import type { EntityCollection } from '@/store/types/sceneEntityTypes';

type WithId = { id: string };

export function createEntityHistoryActions<T extends WithId>(
  collection: EntityCollection
) {
  const updateItems = (update: (items: T[]) => T[]) => {
    useEditorStore.setState(
      (state) =>
        ({
          [collection]: update(state[collection] as unknown as T[]),
        }) as Partial<EditorState>
    );
  };

  return {
    remove: (ids: string[]) => {
      const idSet = new Set(ids);
      updateItems((items) => items.filter((item) => !idSet.has(item.id)));
    },
    restore: (entities: T[]) => {
      updateItems((items) => [
        ...items,
        ...entities.filter(
          (entity) => !items.some((item) => item.id === entity.id)
        ),
      ]);
    },
  };
}
