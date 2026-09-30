import {
  AssessmentOutlined,
  CancelOutlined,
  PlayCircleOutline,
  RefreshOutlined,
  StopCircleOutlined,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAppToast } from '@/shared/ui/AppToast';
import { useSimulationRuns } from '@/features/simulation-runs';
import type { SimulationRun } from '@/features/simulation-runs';
import './styles/RunsPage.scss';

const statusLabel: Record<SimulationRun['status'], string> = {
  queued: 'Queued',
  running: 'Running',
  stopping: 'Stopping',
  finished: 'Completed',
  error: 'Failed',
  cancelled: 'Cancelled',
  idle: 'Idle',
};

const dateTime = (value?: number | null) =>
  value
    ? new Date(value * 1000).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Just now';

export default function RunsPage() {
  const {
    runs,
    error,
    isLoading,
    isRefreshing,
    refresh,
    cancel,
    cancellingRunId,
  } = useSimulationRuns();
  const toast = useAppToast();
  const inProgress = runs.filter(
    (run) =>
      run.status === 'queued' ||
      run.status === 'running' ||
      run.status === 'stopping'
  );

  const stopOrCancel = async (run: SimulationRun) => {
    try {
      const response = await cancel(run.run_id);
      toast.success(
        response.status === 'stopping'
          ? 'Simulation is stopping after the current step.'
          : 'Queued simulation cancelled.'
      );
    } catch {
      toast.error('Could not update this simulation. Please try again.');
    }
  };

  return (
    <section className="workspace-runs">
      <div className="workspace-page-heading">
        <div>
          <span className="workspace-kicker">SIMULATION ACTIVITY</span>
          <h1>Runs</h1>
          <p>Monitor CARLA capacity, queued work and completed simulations.</p>
        </div>
        <button
          type="button"
          className="workspace-secondary workspace-refresh"
          onClick={() => void refresh()}
          disabled={isRefreshing}
        >
          <RefreshOutlined aria-hidden="true" />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="workspace-run-summary" aria-label="Run summary">
        <div>
          <strong>{inProgress.length}</strong>
          <span>In progress</span>
        </div>
        <div>
          <strong>
            {runs.filter((run) => run.status === 'queued').length}
          </strong>
          <span>Queued</span>
        </div>
        <div>
          <strong>
            {runs.filter((run) => run.status === 'finished').length}
          </strong>
          <span>Completed</span>
        </div>
      </div>

      {isLoading ? (
        <div className="workspace-empty workspace-empty--loading" role="status">
          <span className="workspace-empty__icon" aria-hidden="true">
            <PlayCircleOutline />
          </span>
          <strong>Loading simulation runs</strong>
          <p>Checking the current CARLA queue…</p>
        </div>
      ) : error ? (
        <div className="workspace-empty" role="alert">
          <span className="workspace-empty__icon" aria-hidden="true">
            <AssessmentOutlined />
          </span>
          <strong>Could not load simulation runs</strong>
          <p>The backend may be restarting. Refresh to try again.</p>
          <button
            type="button"
            className="workspace-secondary"
            onClick={() => void refresh()}
          >
            Try again
          </button>
        </div>
      ) : !runs.length ? (
        <div className="workspace-empty">
          <span className="workspace-empty__icon" aria-hidden="true">
            <PlayCircleOutline />
          </span>
          <strong>No simulation runs yet</strong>
          <p>Open a scenario in the editor to create the first run.</p>
          <Link
            className="workspace-primary workspace-empty__action"
            to="/editor"
          >
            Open editor
          </Link>
        </div>
      ) : (
        <div className="workspace-run-list">
          {runs.map((run) => {
            const cancellable =
              run.status === 'queued' || run.status === 'running';
            const isCancelling = cancellingRunId === run.run_id;
            const progress =
              run.max_ticks > 0 ? Math.min(run.tick, run.max_ticks) : 0;
            return (
              <article className="workspace-run-card" key={run.run_id}>
                <div className="workspace-run-card__identity">
                  <span className={`workspace-run-status is-${run.status}`}>
                    {statusLabel[run.status]}
                  </span>
                  <div>
                    <h2>{run.scenario_name || 'Untitled scenario'}</h2>
                    <p>
                      {run.map || 'Map not specified'} ·{' '}
                      {dateTime(run.modified_at)}
                    </p>
                  </div>
                </div>
                <div className="workspace-run-card__details">
                  <span title={run.run_id}>Run ID: {run.run_id}</span>
                  {run.status === 'queued' && run.queue_position ? (
                    <span>Queue position {run.queue_position}</span>
                  ) : null}
                  {(run.status === 'running' || run.status === 'stopping') &&
                  run.max_ticks > 0 ? (
                    <label>
                      <span>
                        {run.tick.toLocaleString()} /{' '}
                        {run.max_ticks.toLocaleString()} steps
                      </span>
                      <progress max={run.max_ticks} value={progress} />
                    </label>
                  ) : null}
                  {run.partial ? <span>Stopped early</span> : null}
                  {run.error ? (
                    <span className="workspace-run-card__error">
                      {run.error}
                    </span>
                  ) : null}
                </div>
                <div className="workspace-run-card__actions">
                  {cancellable ? (
                    <button
                      type="button"
                      className="workspace-secondary workspace-run-card__stop"
                      disabled={isCancelling}
                      onClick={() => void stopOrCancel(run)}
                    >
                      {run.status === 'running' ? (
                        <StopCircleOutlined />
                      ) : (
                        <CancelOutlined />
                      )}
                      {isCancelling
                        ? 'Updating…'
                        : run.status === 'running'
                          ? 'Stop'
                          : 'Cancel'}
                    </button>
                  ) : null}
                  {run.status === 'finished' ? (
                    <Link
                      className="workspace-secondary workspace-run-card__results"
                      to={`/editor?workspace=results&run=${encodeURIComponent(run.run_id)}`}
                    >
                      <AssessmentOutlined />
                      Results
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
