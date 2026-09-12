import { useId, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '@/store';
import {
  getSelectedEntities,
  resolveSelection,
} from '@/store/utils/sceneEntities';
import { useAppToast } from '@/components/AppToast';
import {
  getBatchFields,
  getCommonValue,
  parseBatchValue,
  type BatchField,
} from '../model/batchFields';
import {
  applyBatchProperty,
  deleteSelectedObjects,
} from '../model/batchActions';
import '../styles/MultiSelectionProperties.scss';

function PropertyField({
  field,
  value,
}: {
  field: BatchField;
  value: string | number | null;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  const [error, setError] = useState(false);
  const skipCommit = useRef(false);
  const commit = () => {
    if (skipCommit.current) {
      skipCommit.current = false;
      return;
    }
    if (!draft.trim()) {
      setDraft(value === null ? '' : String(value));
      setError(false);
      return;
    }
    if (parseBatchValue(field, draft) === null) {
      setError(true);
      return;
    }
    setError(false);
    applyBatchProperty(field.key, draft);
  };
  return (
    <div className="batch-field">
      <label htmlFor={id}>{field.label}</label>
      {field.options ? (
        <select
          id={id}
          value={value ?? ''}
          onChange={(event) =>
            applyBatchProperty(field.key, event.target.value)
          }
        >
          {value === null && (
            <option value="" disabled>
              Mixed
            </option>
          )}
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.color ? 'text' : 'number'}
          value={draft}
          placeholder={value === null ? 'Mixed' : undefined}
          min={field.min}
          max={field.max}
          step={field.step ?? 'any'}
          aria-invalid={error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(false);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              skipCommit.current = true;
              setDraft(value === null ? '' : String(value));
              setError(false);
              event.currentTarget.blur();
            }
          }}
        />
      )}
      {error && (
        <span id={`${id}-error`} className="batch-error" role="alert">
          {field.color
            ? 'Use six hex digits, for example #2563eb.'
            : `Enter a valid number${field.min !== undefined ? ` from ${field.min}` : ''}${field.max !== undefined ? ` to ${field.max}` : ''}.`}
        </span>
      )}
    </div>
  );
}

export default function MultiSelectionProperties({
  readOnly = false,
}: {
  readOnly?: boolean;
}) {
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
            <PropertyField
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
