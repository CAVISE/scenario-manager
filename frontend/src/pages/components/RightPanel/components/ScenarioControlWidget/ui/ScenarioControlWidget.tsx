import { useMemo, useState } from 'react';
import '../styles/textarea.scss';

import {
  handleCreate,
  handleDelete,
  handleLoad,
  handlePatch,
  handleRunSimulation,
} from '../Handlers';
import {
  useScenarioCreateMutation,
  useScenarioPatchMutation,
  useScenarioDeleteMutation,
} from '@editor/hooks/useApiHooks/useScenarioQueries';
import { useEditorStore } from '@/store';
import { useStartSimulationMutation } from '@editor/hooks/useApiHooks/useSimulationMutation';
import { useEditorRefs, useHooks } from '@editor/context';
import { useStatusesQuery } from '@editor/hooks/useApiHooks/useStatusesQuery';
import { useNoticeWithToast } from '@/components/AppToast';

export default function ScenarioControlWidget() {
  const scenario = useEditorStore((s) => s.Scenario);
  const updateScenario = useEditorStore((s) => s.updateScenario);
  const { odrMapRef } = useEditorRefs();
  const { updateSceneGraph, loadFile, setStep } = useHooks();
  const [scenarioIdInput, setScenarioIdInput] = useState(scenario.id ?? '');
  const [notice, setNotice] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const setNoticeWithToast = useNoticeWithToast(setNotice);

  const createScenarioMutation = useScenarioCreateMutation();
  const patchScenarioMutation = useScenarioPatchMutation();
  const deleteScenarioMutation = useScenarioDeleteMutation();
  const startSimulationMutation = useStartSimulationMutation();

  const statusesQuery = useStatusesQuery();
  const statusesPreview = useMemo(
    () => (statusesQuery.data ?? []).slice(0, 3),
    [statusesQuery.data]
  );

  const hasId = scenarioIdInput.trim().length > 0;
  const isBusy =
    createScenarioMutation.isPending ||
    patchScenarioMutation.isPending ||
    deleteScenarioMutation.isPending ||
    startSimulationMutation.isPending;

  return (
    <div className="rp-scenario-widget">
      <label className="rp-scenario-label" htmlFor="scenario-id-input">
        Scenario ID
      </label>
      <input
        id="scenario-id-input"
        className="rp-scenario-input"
        value={scenarioIdInput}
        onChange={(e) => setScenarioIdInput(e.target.value)}
        onBlur={() => {
          if (scenarioIdInput.trim())
            updateScenario({ id: scenarioIdInput.trim() });
        }}
        placeholder="Enter scenario_id"
      />

      <div className="rp-scenario-actions">
        <button
          type="button"
          className="rp-btn rp-btn-secondary"
          disabled={!hasId || isBusy}
          onClick={() =>
            handleLoad({
              hasId,
              scenarioIdInput,
              setNotice: setNoticeWithToast,
              updateSceneGraph,
              loadFile,
              setStep,
            })
          }
        >
          LOAD
        </button>
        <button
          type="button"
          className="rp-btn rp-btn-primary"
          disabled={isBusy}
          onClick={() =>
            handleCreate(
              setNoticeWithToast,
              createScenarioMutation,
              scenarioIdInput,
              setScenarioIdInput
            )
          }
        >
          SAVE
        </button>
        <button
          type="button"
          className="rp-btn rp-btn-secondary"
          disabled={!hasId || isBusy}
          onClick={() =>
            handlePatch(
              setNoticeWithToast,
              scenarioIdInput,
              hasId,
              patchScenarioMutation
            )
          }
        >
          UPDATE
        </button>
        <button
          type="button"
          className="rp-btn rp-btn-secondary"
          disabled={!hasId || isBusy}
          onClick={() => setDeleteConfirmOpen(true)}
        >
          DELETE
        </button>
      </div>

      <button
        type="button"
        className="rp-btn rp-btn-run"
        disabled={isBusy || !hasId}
        onClick={() =>
          handleRunSimulation(
            setNoticeWithToast,
            scenarioIdInput,
            startSimulationMutation,
            odrMapRef.current
              ? {
                  x: odrMapRef.current.x_offs,
                  y: -odrMapRef.current.y_offs,
                }
              : undefined
          )
        }
      >
        Run simulation
      </button>

      {notice && <div className="rp-scenario-notice">{notice}</div>}

      {deleteConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDeleteConfirmOpen(false)}
        >
          <div
            style={{
              background: '#12161b',
              border: '1px solid rgba(105, 240, 174, 0.15)',
              borderRadius: 6,
              padding: '20px 24px',
              maxWidth: 360,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              fontFamily: "'Courier New', Courier, monospace",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              id="delete-confirm-title"
              style={{
                fontSize: 13,
                letterSpacing: '0.04em',
                color: 'rgb(255, 121, 121)',
                marginBottom: 8,
              }}
            >
              Delete scenario?
            </div>
            <div
              style={{
                fontSize: 11,
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: 18,
              }}
            >
              This permanently deletes scenario{' '}
              <strong>{scenarioIdInput.trim() || scenario.id}</strong> on the
              server. This cannot be undone.
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                type="button"
                className="rp-btn rp-btn-secondary"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rp-btn"
                style={{
                  background: 'rgba(255, 90, 90, 0.15)',
                  border: '1px solid rgba(255, 90, 90, 0.4)',
                  color: 'rgb(255, 160, 160)',
                }}
                disabled={isBusy}
                onClick={async () => {
                  setDeleteConfirmOpen(false);
                  await handleDelete(
                    setNoticeWithToast,
                    scenarioIdInput,
                    hasId,
                    deleteScenarioMutation
                  );
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rp-scenario-statuses">
        <div className="rp-scenario-statuses-header">
          <span>Statuses</span>
          <button
            type="button"
            className="rp-link-btn"
            onClick={() => statusesQuery.refetch()}
          >
            Refresh
          </button>
        </div>
        {statusesQuery.isLoading && (
          <div className="rp-scenario-muted">Loading...</div>
        )}
        {statusesQuery.isError && (
          <div className="rp-scenario-muted">Error loading statuses</div>
        )}
        {!statusesQuery.isLoading &&
          !statusesQuery.isError &&
          statusesPreview.length === 0 && (
            <div className="rp-scenario-muted">No data</div>
          )}
        {statusesPreview.map((item) => (
          <div className="rp-scenario-status-row" key={item.scenario_id}>
            <span className="rp-scenario-status-name">
              {item.scenario_name}
            </span>
            <span
              className={`rp-scenario-status-pill ${item.status === 'true' ? 'ok' : 'pending'}`}
            >
              {item.status === 'true' ? 'Ready' : 'In Progress'}
            </span>
          </div>
        ))}
        <textarea
          className="textarea"
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(105,240,174,0.45)';
            e.target.style.background = 'rgba(105,240,174,0.06)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(105,240,174,0.15)';
            e.target.style.background = 'rgba(105,240,174,0.03)';
          }}
          name="scenario-description"
          placeholder="Enter scenario description"
          onChange={(e) => updateScenario({ description: e.target.value })}
          value={scenario.description || ''}
        />
      </div>
    </div>
  );
}
