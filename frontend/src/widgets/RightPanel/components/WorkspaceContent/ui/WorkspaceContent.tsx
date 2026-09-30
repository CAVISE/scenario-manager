import { useState } from 'react';
import { useEditorStore } from '@/store';
import { useStopSimulationMutation } from '@editor/hooks/useApiHooks/useSimulationMutation';
import { useNoticeWithToast } from '@/shared/ui/AppToast';
import { ResultsWorkspace } from '@/features/results';
import type { WorkspaceContentProps } from '../../../types/PanelTypes';

export function WorkspaceContent({
  tab,
  controls,
  connected,
  onOpenContext,
  onOpenResults,
  preferredResultRunId,
}: WorkspaceContentProps) {
  const scenario = useEditorStore((state) => state.Scenario);
  const session = useEditorStore((state) => state.simulationSession);
  const updateSession = useEditorStore(
    (state) => state.updateSimulationSession
  );
  const stopMutation = useStopSimulationMutation();
  const [notice, setNotice] = useState('');
  const setNoticeWithToast = useNoticeWithToast(setNotice);

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

  if (tab === 'results') {
    return (
      <ResultsWorkspace
        onOpenContext={onOpenContext}
        preferredRunId={preferredResultRunId}
      />
    );
  }

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
          <>
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
            <button
              type="button"
              className="rp-btn rp-btn-secondary"
              disabled={controls.isBusy || !scenario.name.trim()}
              onClick={controls.run}
            >
              {controls.operation === 'run'
                ? 'Adding…'
                : 'Add current scenario to queue'}
            </button>
          </>
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
      <button type="button" className="rp-quick-action" onClick={onOpenContext}>
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
