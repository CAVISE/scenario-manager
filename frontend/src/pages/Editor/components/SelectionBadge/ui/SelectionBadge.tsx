import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '@/store';
import { getSelectedEntities } from '@/store/utils/sceneEntities';

export function SelectionBadge() {
  const state = useEditorStore(
    useShallow((s) => ({
      cars: s.cars,
      RSUs: s.RSUs,
      buildings: s.buildings,
      pedestrians: s.pedestrians,
      points: s.points,
      lidars: s.lidars,
      selectedIds: s.selectedIds,
    }))
  );
  const items = getSelectedEntities(state);
  if (!items.length) return null;

  const text =
    items.length === 1 ? items[0].label : `${items.length} objects selected`;

  return (
    <div className="editor-selection-badge" title={text}>
      {text}
    </div>
  );
}
