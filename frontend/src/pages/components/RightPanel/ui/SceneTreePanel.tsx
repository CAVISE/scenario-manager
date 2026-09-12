import { useEffect, useId, useState } from 'react';

import CarProperties from '../components/CarProperties';
import LidarProperties from '../components/LidarProperties';
import RSUProperties from '../components/RSUProperties';
import BuildingProperties from '../components/BuildingProperties';
import RoutePointProperties from '../components/RoutePointProperties';
import type { SectionProps } from '../types/PanelTypes';
import '../styles/RightPanel.scss';
import PedestrianProperties from '../components/PedestrianProperties';
import { useEditorStore } from '@/store';
import SceneTreePanel from '../components/SceneTreePanel';
import { useSelectedObject } from '@editor/hooks/useEditorEngine/useSelectedObject';
import type { EditorTab } from '@editor/components/EditorNavigation/types/EditorNavigationTypes';
import { useSimulationSocket } from '@editor/hooks/useApiHooks/useSimulationSocket';
import { useStopSimulationMutation } from '@editor/hooks/useApiHooks/useSimulationMutation';
import { useNoticeWithToast } from '@/components/AppToast';
import ScenarioControlWidget from '../components/ScenarioControlWidget';
import MultiSelectionProperties from '../components/MultiSelectionProperties/ui/MultiSelectionProperties';
import type { ScenarioControls } from '../components/ScenarioControlWidget/hooks/useScenarioControls';
import SimConfigModal from '@editor/components/SimConfigModal';
import {
  PropertiesModeContext,
  type PropertiesMode,
} from '../context/PropertiesModeContext';
import { api } from '@/api/client';
import { API_URL } from '@/VARS';
import {
  AssessmentOutlined,
  InsertDriveFileOutlined,
  NearMeOutlined,
  RefreshOutlined,
} from '@mui/icons-material';

const Section: React.FC<SectionProps> = ({
  label,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionId = useId();

  return (
    <div className="rp-section">
      <button
        type="button"
        className="rp-section-header"
        aria-expanded={isOpen}
        aria-controls={sectionId}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="rp-section-label">{label}</span>
        <span
          aria-hidden="true"
          className={`rp-section-chevron ${isOpen ? 'open' : ''}`}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div id={sectionId} className="rp-section-content">
          {children}
        </div>
      )}
    </div>
  );
};

type WorkspacePlaceholderProps = {
  tab: 'simulation' | 'results';
  controls: ScenarioControls;
  connected: boolean;
  onOpenContext: () => void;
  onOpenResults: () => void;
};

function WorkspaceContent({
  tab,
  controls,
  connected,
  onOpenContext,
  onOpenResults,
}: WorkspacePlaceholderProps) {
  const isSimulation = tab === 'simulation';
  const scenario = useEditorStore((s) => s.Scenario);
  const session = useEditorStore((s) => s.simulationSession);
  const updateSession = useEditorStore((s) => s.updateSimulationSession);
  const stopMutation = useStopSimulationMutation();
  const [notice, setNotice] = useState('');
  const [resultFiles, setResultFiles] = useState<
    Array<{ filename: string; url: string }>
  >([]);
  const [resultRuns, setResultRuns] = useState<
    Array<{
      run_id: string;
      files_count: number;
      modified_at: number;
      scenario_name?: string | null;
      outcome?: string;
      tick?: number;
      max_ticks?: number;
    }>
  >([]);
  const [selectedResultRunIds, setSelectedResultRunIds] = useState<string[]>(
    []
  );
  const [comparisonFiles, setComparisonFiles] = useState<
    Array<{ filename: string; urls: string[] }>
  >([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const resultsLoading = runsLoading || filesLoading;
  const resultsError = runsError ?? filesError;
  const setNoticeWithToast = useNoticeWithToast(setNotice);

  useEffect(() => {
    if (isSimulation) return;

    let cancelled = false;
    setRunsLoading(true);
    setRunsError(null);
    api
      .get('api/results')
      .json<typeof resultRuns>()
      .then((runs) => {
        if (cancelled) return;
        setResultRuns(runs);
        setSelectedResultRunIds((current) => {
          const available = runs.map((run) => run.run_id);
          const preferred =
            session.runId && available.includes(session.runId)
              ? session.runId
              : (current.find((id) => available.includes(id)) ?? available[0]);
          return preferred ? [preferred] : [];
        });
      })
      .catch(() => {
        if (!cancelled) {
          setResultRuns([]);
          setSelectedResultRunIds([]);
          setRunsError('Could not load run history. Refresh to try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setRunsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSimulation, session.runId, session.phase, refreshKey]);

  useEffect(() => {
    setResultFiles([]);
    setComparisonFiles([]);
    setFilesError(null);
    setFilesLoading(false);
    if (isSimulation || selectedResultRunIds.length === 0) return;

    let cancelled = false;
    setFilesLoading(true);
    Promise.all(
      selectedResultRunIds.map((runId) =>
        api.get(`api/results/${encodeURIComponent(runId)}`).json<{
          files: Array<{ filename: string; url: string }>;
          run_id: string;
        }>()
      )
    )
      .then((responses) => {
        if (cancelled) return;
        setResultFiles(responses[0]?.files ?? []);
        if (responses.length > 1) {
          const byName = new Map<string, string[]>();
          responses.forEach((response) => {
            response.files.forEach((file) => {
              const urls = byName.get(file.filename) ?? [];
              urls.push(file.url);
              byName.set(file.filename, urls);
            });
          });
          setComparisonFiles(
            [...byName.entries()]
              .filter(([, urls]) => urls.length === responses.length)
              .map(([filename, urls]) => ({ filename, urls }))
          );
        } else {
          setComparisonFiles([]);
        }
      })
      .catch(() => {
        if (!cancelled)
          setFilesError(
            'Could not load result files. Select the run again to retry.'
          );
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSimulation, selectedResultRunIds]);

  const stop = () => {
    stopMutation.mutate(undefined, {
      onSuccess: () => updateSession({ status: 'stopping', phase: 'running' }),
      onError: (error) =>
        setNoticeWithToast(
          `Failed to stop simulation: ${String(error)}`,
          'error'
        ),
    });
  };

  if (isSimulation) {
    const isRunning = session.phase === 'running';
    const isFinished = session.phase === 'finished';
    const isError = session.phase === 'error';
    const tick = session.tick ?? 0;
    const maxTicks = session.maxTicks ?? 0;
    const progress =
      maxTicks > 0 ? Math.min(100, Math.round((tick / maxTicks) * 100)) : 0;

    return (
      <div
        className="rp-simulation-workspace"
        role="tabpanel"
        aria-label="Simulation workspace"
      >
        <span className="rp-workspace-kicker">RUN CONTROL</span>
        <h2>
          {isRunning
            ? session.status === 'stopping'
              ? 'Stopping simulation'
              : 'Simulation in progress'
            : isFinished
              ? session.partial
                ? 'Run stopped'
                : 'Run complete'
              : isError
                ? 'Run interrupted'
                : 'Ready to simulate'}
        </h2>
        <div className={`rp-simulation-state ${session.phase}`}>
          <span className="rp-simulation-state-dot" />
          {isRunning
            ? session.status === 'stopping'
              ? 'Stopping'
              : 'Running'
            : isFinished
              ? session.partial
                ? 'Partial results'
                : 'Finished'
              : isError
                ? 'Error'
                : 'Idle'}
        </div>
        <p className="rp-run-scenario-name">
          {scenario.name || 'Untitled scenario'}
        </p>
        {(isRunning || isFinished) && maxTicks > 0 && (
          <div className="rp-run-progress">
            <div>
              <span>Simulation steps</span>
              <strong>
                {tick.toLocaleString()} / {maxTicks.toLocaleString()}
              </strong>
            </div>
            <progress
              aria-label="Simulation progress"
              max={maxTicks}
              value={tick}
            />
            <span>
              {session.status === 'stopping'
                ? 'Finishing the current step and saving results…'
                : isFinished
                  ? session.partial
                    ? 'Results include the steps completed before stopping.'
                    : 'Results are ready to inspect.'
                  : `${progress}% of step limit`}
            </span>
          </div>
        )}
        <p>
          {session.status === 'stopping'
            ? 'Stopping…'
            : controls.operation === 'run'
              ? 'Saving scenario and preparing simulation…'
              : isRunning
                ? 'You can inspect the scene while the simulation runs.'
                : isFinished
                  ? 'Review the output or adjust the scenario for another run.'
                  : 'Your scenario will be saved before the run starts.'}
        </p>
        {session.error && (
          <div className="rp-scenario-notice" role="alert">
            {session.error}
          </div>
        )}
        {session.runId && (
          <span className="rp-workspace-note">Run {session.runId}</span>
        )}
        <div className="rp-simulation-actions">
          {isRunning ? (
            <button
              type="button"
              className="rp-btn rp-btn-danger"
              disabled={
                stopMutation.isPending ||
                session.status === 'stopping' ||
                controls.isBusy
              }
              onClick={stop}
            >
              {session.status === 'stopping' ? 'Stopping…' : 'Stop'}
            </button>
          ) : (
            <button
              type="button"
              className={`rp-btn ${isFinished ? 'rp-btn-secondary' : 'rp-btn-run'}`}
              disabled={controls.isBusy || !scenario.name.trim()}
              onClick={controls.run}
            >
              {controls.operation === 'run'
                ? 'Preparing…'
                : isFinished
                  ? 'Run again'
                  : 'Run simulation'}
            </button>
          )}
          {isFinished && (
            <button
              type="button"
              className="rp-btn rp-btn-primary"
              onClick={onOpenResults}
            >
              View results
            </button>
          )}
        </div>
        {!scenario.name.trim() && (
          <p>Give the scenario a name in Context before running.</p>
        )}
        <button
          type="button"
          className="rp-quick-action"
          onClick={onOpenContext}
        >
          Scenario context →
        </button>
        {!connected && (
          <span className="rp-workspace-note">Status channel reconnecting</span>
        )}
        {controls.notice && (
          <div className="rp-scenario-notice" role="status">
            {controls.notice}
          </div>
        )}
        {notice && <div className="rp-scenario-notice">{notice}</div>}
      </div>
    );
  }

  const resultBaseUrl = API_URL.replace(/\/$/, '');

  return (
    <div
      className="rp-workspace-placeholder rp-results-workspace"
      role="tabpanel"
      aria-label={isSimulation ? 'Simulation workspace' : 'Results workspace'}
    >
      <div className="rp-results-heading">
        <div>
          <span className="rp-workspace-kicker">RUN HISTORY</span>
          <h2>Explore results</h2>
        </div>
        <button
          type="button"
          className="rp-icon-button"
          aria-label="Refresh results"
          title="Refresh results"
          disabled={resultsLoading}
          onClick={() => setRefreshKey((key) => key + 1)}
        >
          <RefreshOutlined fontSize="small" />
        </button>
      </div>
      <p>Choose one run to inspect, or two to compare their output.</p>
      {selectedResultRunIds.length === 0 && !resultsLoading && (
        <span className="rp-workspace-note">No completed run selected</span>
      )}
      {resultRuns.length > 0 && (
        <div className="rp-results-runs">
          {resultRuns.map((run) => {
            const selected = selectedResultRunIds.includes(run.run_id);
            return (
              <button
                key={run.run_id}
                type="button"
                className={`rp-results-run${selected ? ' active' : ''}`}
                aria-pressed={selected}
                onClick={() => {
                  setSelectedResultRunIds((current) =>
                    selected
                      ? current.filter((id) => id !== run.run_id)
                      : [...current.slice(-1), run.run_id]
                  );
                }}
              >
                <span className="rp-result-run-copy">
                  <strong>{run.scenario_name || run.run_id}</strong>
                  <span>
                    {new Date(run.modified_at * 1000).toLocaleString(
                      undefined,
                      { dateStyle: 'medium', timeStyle: 'short' }
                    )}
                  </span>
                  <span>
                    {run.files_count} files
                    {run.outcome === 'partial' ? ' · Partial run' : ''}
                  </span>
                </span>
                <span className="rp-result-choice" aria-hidden="true">
                  {selected ? '✓' : '+'}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {selectedResultRunIds.length > 0 && (
        <span className="rp-workspace-note">
          {selectedResultRunIds.length > 1
            ? 'Comparing two runs'
            : `Run ${selectedResultRunIds[0]}`}
        </span>
      )}
      {resultsLoading && (
        <span className="rp-workspace-note" role="status">
          Loading result files...
        </span>
      )}
      {resultsError && (
        <span className="rp-results-error" role="alert">
          {resultsError}
        </span>
      )}
      {!resultsLoading && !resultsError && resultRuns.length === 0 && (
        <div className="rp-results-empty">
          <AssessmentOutlined aria-hidden="true" />
          <strong>No completed runs yet</strong>
          <p>
            Run your scenario to collect plots, logs and configuration files.
          </p>
          <button
            type="button"
            className="rp-btn rp-btn-primary"
            onClick={onOpenContext}
          >
            Set up a scenario
          </button>
        </div>
      )}
      {!resultsLoading &&
        selectedResultRunIds.length > 0 &&
        resultFiles.length === 0 &&
        !resultsError && (
          <span className="rp-workspace-note">No result files found</span>
        )}
      {resultFiles.length > 0 && (
        <div className="rp-results-files">
          {resultFiles.map((file) => (
            <a
              key={file.filename}
              className="rp-results-file"
              href={`${resultBaseUrl}${file.url}`}
              target="_blank"
              rel="noreferrer"
            >
              <InsertDriveFileOutlined fontSize="small" aria-hidden="true" />
              <span className="rp-result-filename">{file.filename}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      )}
      {comparisonFiles.length > 0 && (
        <div className="rp-results-files">
          <span className="rp-workspace-kicker">COMMON OUTPUTS</span>
          {comparisonFiles.map((file) => (
            <div key={file.filename} className="rp-results-comparison">
              <strong>{file.filename}</strong>
              <span>
                {file.urls.map((url, index) => (
                  <a
                    key={url}
                    href={`${resultBaseUrl}${url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Run {index + 1}
                  </a>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RightPanel({
  activeTab = 'edit',
  showSceneGraph = true,
  readOnly = false,
  controls,
  onTabChange,
}: {
  activeTab?: EditorTab;
  showSceneGraph?: boolean;
  readOnly?: boolean;
  controls: ScenarioControls;
  onTabChange: (tab: EditorTab) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setCollapsed(false), [activeTab]);
  const [panelMode, setPanelMode] = useState<'properties' | 'context'>(
    'properties'
  );
  const [simConfigOpen, setSimConfigOpen] = useState(false);
  const { connected } = useSimulationSocket();
  const scenarioName = useEditorStore((s) => s.Scenario.name);
  const [propertiesMode, setPropertiesMode] = useState<PropertiesMode>('basic');
  const setChangePanelMode = useEditorStore((s) => s.setChangePanelMode);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const {
    car,
    carLidars,
    rsu,
    building,
    lidar,
    point,
    isCar,
    isRSU,
    isCircle,
    isBuilding,
    isLidar,
    hasSelection,
    isPedestrian,
    pedestrian,
  } = useSelectedObject();

  const onDeleteSelected = () =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
  const dispatchObjectAction = (name: string) => {
    const id = selectedIds[0];
    if (id) window.dispatchEvent(new CustomEvent(name, { detail: { id } }));
  };
  return (
    <>
      <button
        type="button"
        aria-label={collapsed ? 'Show context panel' : 'Hide context panel'}
        aria-expanded={!collapsed}
        aria-controls="editor-workspace-panel"
        className={`rp-toggle ${collapsed ? '' : 'open'}`}
        onClick={() => {
          setCollapsed((v) => !v);
          setChangePanelMode();
        }}
      >
        <span className="rp-toggle-arrow">❯</span>
      </button>

      <div
        className={`rp-root ${collapsed ? 'collapsed' : ''}`}
        aria-hidden={collapsed}
        style={collapsed ? { visibility: 'hidden' } : undefined}
      >
        <div className="rp-header">
          <div className="rp-header-row">
            <span className="rp-title">
              {activeTab === 'edit'
                ? 'Inspector'
                : activeTab === 'simulation'
                  ? 'Simulation'
                  : 'Results'}
            </span>
            <span className="rp-badge">V2X</span>
          </div>
          <div className="rp-subtitle">
            {scenarioName || 'Untitled scenario'}
          </div>
          {activeTab === 'edit' && (
            <div
              className="rp-panel-switcher"
              role="group"
              aria-label="Inspector view"
            >
              <button
                type="button"
                aria-pressed={panelMode === 'properties'}
                onClick={() => setPanelMode('properties')}
              >
                Properties
              </button>
              <button
                type="button"
                aria-pressed={panelMode === 'context'}
                onClick={() => setPanelMode('context')}
              >
                Context
              </button>
            </div>
          )}
        </div>

        <div
          className="rp-body"
          id="editor-workspace-panel"
          role="tabpanel"
          aria-label={
            activeTab === 'edit' ? 'Edit workspace' : `${activeTab} workspace`
          }
        >
          {activeTab === 'edit' && panelMode === 'context' ? (
            <ScenarioControlWidget
              controls={controls}
              readOnly={readOnly}
              onOpenSimulation={() => onTabChange('simulation')}
              onOpenResults={() => onTabChange('results')}
              onOpenSettings={() => setSimConfigOpen(true)}
            />
          ) : activeTab === 'edit' ? (
            <>
              {showSceneGraph && (
                <Section label="Objects">
                  <SceneTreePanel readOnly={readOnly} />
                </Section>
              )}

              <Section label="Properties">
                {selectedIds.length > 0 && (
                  <div className="rp-properties-toolbar">
                    <div className="rp-properties-heading">
                      <span className="rp-properties-title">Selection</span>
                      {selectedIds.length > 0 && (
                        <span className="rp-selection-count">
                          {selectedIds.length} selected
                        </span>
                      )}
                    </div>
                    <div
                      className="rp-properties-tabs"
                      role="group"
                      aria-label="Property detail level"
                    >
                      {(['basic', 'advanced'] as PropertiesMode[]).map(
                        (mode) => (
                          <button
                            key={mode}
                            type="button"
                            aria-pressed={propertiesMode === mode}
                            className={propertiesMode === mode ? 'active' : ''}
                            onClick={() => setPropertiesMode(mode)}
                          >
                            {mode === 'basic' ? 'Basic' : 'Advanced'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {propertiesMode === 'advanced' && selectedIds.length === 1 && (
                  <div className="rp-context-id">
                    Object ID: {selectedIds[0]}
                  </div>
                )}
                {selectedIds.length > 1 ? (
                  <MultiSelectionProperties
                    readOnly={readOnly || controls.isBusy}
                  />
                ) : (
                  <fieldset
                    disabled={readOnly || controls.isBusy}
                    className="rp-properties-fieldset"
                  >
                    <PropertiesModeContext.Provider value={propertiesMode}>
                      {!hasSelection && (
                        <div className="rp-empty">
                          <NearMeOutlined aria-hidden="true" />
                          <span className="rp-empty-text">
                            Select an object
                          </span>
                          <p>
                            Choose an object in the scene or the object list to
                            edit its properties.
                          </p>
                        </div>
                      )}
                      {isCar && car && (
                        <CarProperties
                          car={car}
                          carLidars={carLidars}
                          onDelete={onDeleteSelected}
                        />
                      )}
                      {isRSU && rsu && (
                        <RSUProperties rsu={rsu} onDelete={onDeleteSelected} />
                      )}
                      {isCircle && point ? (
                        <RoutePointProperties
                          point={point}
                          onDelete={onDeleteSelected}
                        />
                      ) : null}
                      {isBuilding && building && (
                        <BuildingProperties
                          building={building}
                          onDelete={onDeleteSelected}
                        />
                      )}
                      {isLidar && lidar && (
                        <LidarProperties
                          lidar={lidar}
                          onDelete={onDeleteSelected}
                        />
                      )}
                      {isPedestrian && pedestrian && (
                        <PedestrianProperties
                          pedestrian={pedestrian}
                          onDelete={onDeleteSelected}
                        />
                      )}
                    </PropertiesModeContext.Provider>
                  </fieldset>
                )}
              </Section>

              {hasSelection && selectedIds.length === 1 && (
                <Section label="Quick Actions" defaultOpen={true}>
                  <div className="rp-quick-actions">
                    <button
                      type="button"
                      className="rp-quick-action"
                      onClick={() =>
                        dispatchObjectAction('editor-focus-object')
                      }
                    >
                      <span aria-hidden="true">⌖</span>
                      Focus on object
                    </button>
                    <button
                      type="button"
                      className="rp-quick-action"
                      onClick={() =>
                        dispatchObjectAction('editor-show-in-scene-graph')
                      }
                    >
                      <span aria-hidden="true">☷</span>
                      Show in Scene Graph
                    </button>
                  </div>
                </Section>
              )}
            </>
          ) : (
            <WorkspaceContent
              tab={activeTab}
              controls={controls}
              connected={connected}
              onOpenResults={() => onTabChange('results')}
              onOpenContext={() => {
                setPanelMode('context');
                onTabChange('edit');
              }}
            />
          )}
        </div>

        <div className="rp-footer">
          <span>
            {readOnly ? 'Simulation running · View only' : 'Scenario Manager'}
          </span>
          <span
            className={`rp-connection${connected ? ' connected' : ''}`}
            title={
              connected
                ? 'Live status connected'
                : 'Reconnecting to status channel'
            }
          >
            <span className="rp-footer-dot" />
            {connected ? 'Connected' : 'Reconnecting'}
          </span>
        </div>
      </div>
      <SimConfigModal
        open={simConfigOpen && !readOnly && !controls.isBusy}
        onClose={() => setSimConfigOpen(false)}
      />
    </>
  );
}
