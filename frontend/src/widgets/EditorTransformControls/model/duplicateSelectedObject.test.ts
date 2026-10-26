import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '@/store';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { duplicateSelectedObject } from './duplicateSelectedObject';

describe('duplicateSelectedObject', () => {
  beforeEach(() => {
    useWorkspacePreferences.setState({ duplicateOffset: 0.5 });
    useEditorStore.setState({
      cars: [],
      RSUs: [],
      buildings: [],
      pedestrians: [],
      lidars: [],
      points: [],
      selectedIds: [],
      selectedObjects: [],
    });
  });

  it('duplicates a selected building with an offset and selects its copy', () => {
    const store = useEditorStore.getState();
    const id = store.addBuilding(10, 20, 3);
    store.selectObjects([{ type: 'building', id }]);

    const duplicateId = duplicateSelectedObject();
    const duplicate = useEditorStore
      .getState()
      .buildings.find((building) => building.id === duplicateId);

    expect(duplicate).toMatchObject({ x: 10.5, y: 20.5, z: 3 });
    expect(useEditorStore.getState().selectedIds).toEqual([duplicateId]);
  });
});
