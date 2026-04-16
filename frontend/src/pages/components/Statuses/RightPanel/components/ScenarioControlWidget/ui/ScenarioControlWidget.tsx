import { useMemo, useState } from 'react';
import '../styles/textarea.scss';
import { useScenarioCreateMutation, useScenarioPatchMutation, useScenarioPutMutation } from '../../../../../../Editor/hooks/useScenarioQueries';
import { useStartSimulationMutation } from '../../../../../../Editor/hooks/useSimulationMutation';
import { IScenarioControlWidgetProps } from '../../ScenarioControlWidget/types/ScenarioControlWidgetTypes';
import { handleCreate, handleDelete, handleLoad, handlePatch } from '../Handlers/scenario.handlers';
import { useEditorStore } from '../../../../../../../store/useEditorStore';
import { handleRunSimulation } from '../Handlers/scenario.handlers';
import { useStatusesQuery } from '../../../../useStatusesQuery';
import { useBuildingLoader } from '../../../../../../Editor/hooks/useBuildingLoader';
import { useEditorRefs } from '../../../../../../Editor/context/EditorRefsContext';
export default function ScenarioControlWidget({ updateSceneGraph }: IScenarioControlWidgetProps) {
  const scenario       = useEditorStore(s => s.Scenario);
  const updateScenario = useEditorStore(s => s.updateScenario);
  const buildingModelRef = useBuildingLoader()
  const {sceneRef, loadRSURef} =useEditorRefs()
  const [scenarioIdInput, setScenarioIdInput] = useState(scenario.id ?? '');
  const [notice, setNotice]                   = useState<string>('');

  const createScenarioMutation = useScenarioCreateMutation();
  const patchScenarioMutation  = useScenarioPatchMutation();
  const putScenarioMutation    = useScenarioPutMutation();
  const startSimulationMutation = useStartSimulationMutation();

  const statusesQuery   = useStatusesQuery();
  const statusesPreview = useMemo(() => (statusesQuery.data ?? []).slice(0, 3), [statusesQuery.data]);

  const hasId = scenarioIdInput.trim().length > 0;
  const isBusy =
    createScenarioMutation.isPending ||
    patchScenarioMutation.isPending  ||
    putScenarioMutation.isPending    ||
    startSimulationMutation.isPending;

  return (
    <div className="rp-scenario-widget">
      <label className="rp-scenario-label" htmlFor="scenario-id-input">Scenario ID</label>
      <input
        id="scenario-id-input"
        className="rp-scenario-input"
        value={scenarioIdInput}
        onChange={(e) => setScenarioIdInput(e.target.value)}
        onBlur={() => { if (scenarioIdInput.trim()) updateScenario({ id: scenarioIdInput.trim() }); }}
        placeholder="Enter scenario_id"
      />

      <div className="rp-scenario-actions">
        <button
          type="button"
          className="rp-btn rp-btn-secondary"
          disabled={!hasId || isBusy}
          onClick={() => handleLoad({ hasId, scenarioIdInput, sceneRef, buildingModelRef, setNotice, updateSceneGraph, loadRSURef })}
        >
          GET
        </button>
        <button
          type="button"
          className="rp-btn rp-btn-primary"
          disabled={isBusy}
          onClick={() => handleCreate(setNotice, createScenarioMutation)}
        >
          POST
        </button>
        <button
          type="button"
          className="rp-btn rp-btn-secondary"
          disabled={!hasId || isBusy}
          onClick={() => handlePatch(setNotice, scenarioIdInput, hasId, patchScenarioMutation)}
        >
          PATCH
        </button>
        <button
          type="button"
          className="rp-btn rp-btn-secondary"
          disabled={!hasId || isBusy}
          onClick={() => handleDelete(setNotice, scenarioIdInput, hasId, putScenarioMutation)}
        >
          DELETE
        </button>
      </div>

      <button
        type="button"
        className="rp-btn rp-btn-run"
        disabled={isBusy || !hasId}
        onClick={() => handleRunSimulation(setNotice, scenarioIdInput, startSimulationMutation)}
      >
        Run simulation
      </button>

      {notice && <div className="rp-scenario-notice">{notice}</div>}

      <div className="rp-scenario-statuses">
        <div className="rp-scenario-statuses-header">
          <span>Statuses</span>
          <button type="button" className="rp-link-btn" onClick={() => statusesQuery.refetch()}>
            Refresh
          </button>
        </div>
        {statusesQuery.isLoading && <div className="rp-scenario-muted">Loading...</div>}
        {statusesQuery.isError   && <div className="rp-scenario-muted">Error loading statuses</div>}
        {!statusesQuery.isLoading && !statusesQuery.isError && statusesPreview.length === 0 && (
          <div className="rp-scenario-muted">No data</div>
        )}
        {statusesPreview.map((item) => (
          <div className="rp-scenario-status-row" key={item.scenario_id}>
            <span className="rp-scenario-status-name">{item.scenario_name}</span>
            <span className={`rp-scenario-status-pill ${item.status === 'true' ? 'ok' : 'pending'}`}>
              {item.status === 'true' ? 'Ready' : 'In Progress'}
            </span>
          </div>
        ))}
        <textarea
          className='textarea'
          onFocus={e => { e.target.style.borderColor = 'rgba(105,240,174,0.45)'; e.target.style.background = 'rgba(105,240,174,0.06)'; }}
          onBlur={e  => { e.target.style.borderColor = 'rgba(105,240,174,0.15)'; e.target.style.background = 'rgba(105,240,174,0.03)'; }}
          name="scenario-description"
          placeholder="Enter scenario description"
          onChange={(e) => updateScenario({ description: e.target.value })}
          value={scenario.description || ''}
        />
      </div>
    </div>
  );
}