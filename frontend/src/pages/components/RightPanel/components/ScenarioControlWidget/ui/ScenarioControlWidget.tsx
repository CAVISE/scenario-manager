import { useId, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useEditorStore } from '@/store';
import type { ScenarioControls } from '../hooks/useScenarioControls';

type ScenarioControlWidgetProps = {
  controls: ScenarioControls;
  readOnly?: boolean;
  onOpenSimulation: () => void;
  onOpenResults: () => void;
  onOpenSettings: () => void;
};

export default function ScenarioControlWidget({
  controls,
  readOnly = false,
  onOpenSimulation,
  onOpenResults,
  onOpenSettings,
}: ScenarioControlWidgetProps) {
  const scenario = useEditorStore((s) => s.Scenario);
  const updateScenario = useEditorStore((s) => s.updateScenario);
  const map = useEditorStore((s) => s.simConfig.carla.map);
  const vehicleCount = useEditorStore((s) => s.cars.length);
  const rsuCount = useEditorStore((s) => s.RSUs.length);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const fieldId = useId();
  const hasId = Boolean(scenario.id?.trim());
  const disabled = readOnly || controls.isBusy;

  return (
    <div className="rp-scenario-widget rp-context-widget">
      <div className="rp-context-heading">
        <span className="rp-title">Scenario</span>
        <span className="rp-context-status">
          {hasId ? 'Stored scenario' : 'Local draft'}
        </span>
      </div>
      <fieldset className="rp-context-fields" disabled={disabled}>
        <label htmlFor={`${fieldId}-name`}>Name</label>
        <input
          id={`${fieldId}-name`}
          className="rp-scenario-input"
          value={scenario.name ?? ''}
          placeholder="Scenario name"
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => updateScenario({ name: event.target.value })}
        />
        <label htmlFor={`${fieldId}-description`}>Description</label>
        <textarea
          id={`${fieldId}-description`}
          className="rp-scenario-input rp-context-description"
          rows={3}
          value={scenario.description ?? ''}
          placeholder="What should this scenario demonstrate?"
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) =>
            updateScenario({ description: event.target.value })
          }
        />
      </fieldset>
      <dl className="rp-context-summary">
        <div>
          <dt>Map</dt>
          <dd>{map || 'Not selected'}</dd>
        </div>
        <div>
          <dt>Vehicles</dt>
          <dd>{vehicleCount}</dd>
        </div>
        <div>
          <dt>RSUs</dt>
          <dd>{rsuCount}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="rp-btn rp-btn-primary"
        disabled={disabled}
        onClick={controls.save}
      >
        {controls.operation === 'save' ? 'Saving…' : 'Save scenario'}
      </button>
      {readOnly && (
        <p className="rp-context-help">
          Editing is paused while the simulation is running.
        </p>
      )}
      {controls.notice && (
        <div className="rp-scenario-notice" role="status">
          {controls.notice}
        </div>
      )}
      <div className="rp-context-links" aria-label="Scenario workflow">
        <button
          type="button"
          className="rp-quick-action"
          disabled={disabled}
          onClick={onOpenSettings}
        >
          Simulation parameters <span aria-hidden="true">→</span>
        </button>
        <button
          type="button"
          className="rp-quick-action"
          onClick={onOpenSimulation}
        >
          Open simulation <span aria-hidden="true">→</span>
        </button>
        <button
          type="button"
          className="rp-quick-action"
          onClick={onOpenResults}
        >
          View results <span aria-hidden="true">→</span>
        </button>
      </div>
      <details className="rp-context-advanced">
        <summary>Advanced</summary>
        <div className="rp-context-id">
          Scenario ID: {hasId ? scenario.id : 'Assigned when saved'}
        </div>
        <button
          type="button"
          className="rp-btn rp-context-delete"
          disabled={disabled || !hasId}
          onClick={() => setDeleteConfirmOpen(true)}
        >
          Delete scenario…
        </button>
      </details>
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby={`${fieldId}-delete-title`}
      >
        <DialogTitle id={`${fieldId}-delete-title`}>
          Delete scenario?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently deletes “{scenario.name || 'Untitled scenario'}”
            from the server. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            color="error"
            disabled={disabled || !hasId}
            onClick={() => {
              setDeleteConfirmOpen(false);
              void controls.remove();
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
