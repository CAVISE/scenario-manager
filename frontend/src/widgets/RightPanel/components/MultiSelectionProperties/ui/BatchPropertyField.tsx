import { useId, useRef, useState } from 'react';
import { applyBatchProperty } from '../model/batchActions';
import { parseBatchValue } from '../model/batchFields';
import type { BatchPropertyFieldProps } from '../types/MultiSelectionPropertiesTypes';

export function BatchPropertyField({ field, value }: BatchPropertyFieldProps) {
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
            ? 'Use six hex digits, for example #087b68.'
            : `Enter a valid number${field.min !== undefined ? ` from ${field.min}` : ''}${field.max !== undefined ? ` to ${field.max}` : ''}.`}
        </span>
      )}
    </div>
  );
}
