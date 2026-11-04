import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '@/store';
import {
  getSelectedEntities,
  resolveSelection,
} from '@/store/utils/sceneEntities';
import { useAppToast } from '@/shared/ui/AppToast';
import { getBatchFields, getCommonValue } from '../model/batchFields';
import { deleteSelectedObjects } from '../model/batchActions';
import type { MultiSelectionPropertiesProps } from '../types/MultiSelectionPropertiesTypes';
import { BatchPropertyField } from './BatchPropertyField';
import '../styles/MultiSelectionProperties.scss';

export default function MultiSelectionProperties({
  readOnly = false,
}: MultiSelectionPropertiesProps) {
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
  const items = useMemo(() => getSelectedEntities(state), [state]);
  const fields = getBatchFields(items);
  const toast = useAppToast();
  const selectionKey = items.map((item) => item.id).join(',');
  const isMixed = new Set(items.map((item) => item.type)).size > 1;

  return (
    <div className="batch-properties">
      <p className="batch-help">
        {isMixed
          ? 'Different object types. Only shared fields are shown.'
          : 'Changes apply to every selected object.'}{' '}
        Mixed means the current values differ.
      </p>
      <ul className="batch-selection-list" aria-label="Selected objects">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="batch-object-focus"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('editor-focus-object', {
                    detail: { id: item.id },
                  })
                )
              }
            >
              {item.label}
            </button>
            <button
              type="button"
              aria-label={`Remove ${item.label} from selection`}
              onClick={() => {
                const current = useEditorStore.getState();
                current.selectObjects(
                  resolveSelection(
                    current,
                    current.selectedIds.filter((id) => id !== item.id)
                  )
                );
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <fieldset disabled={readOnly} className="batch-fields">
        <legend>Common properties</legend>
        {fields.map((field) => {
          const value = getCommonValue(items, field.key);
          return (
            <BatchPropertyField
              key={`${selectionKey}:${field.key}:${value}`}
              field={field}
              value={value}
            />
          );
        })}
        {!fields.length && (
          <p className="batch-help">
            This selection has no compatible editable fields.
          </p>
        )}
      </fieldset>
      <p className="batch-help">
        Enter or leave a field to apply. Escape cancels the input.
      </p>
      <button
        type="button"
        className="rp-quick-action"
        onClick={() =>
          window.dispatchEvent(new CustomEvent('editor-focus-selection'))
        }
      >
        Focus selection
      </button>
      <button
        type="button"
        className="rp-btn rp-btn-danger"
        disabled={readOnly || !items.length}
        onClick={() => {
          const result = deleteSelectedObjects();
          if (result)
            toast.success(
              `${result.count} objects deleted. Use Undo to restore.`
            );
        }}
      >
        Delete {items.length} objects
      </button>
    </div>
  );
}
