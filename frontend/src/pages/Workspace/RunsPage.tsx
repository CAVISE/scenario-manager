import {
  AssessmentOutlined,
  PlayCircleOutline,
  RefreshOutlined,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAppToast } from '@/shared/ui/AppToast';
import { useSimulationRuns } from '@/features/simulation-runs';
import type { SimulationRun } from '@/features/simulation-runs';
import { RunCard } from './components/RunCard';
import './styles/RunsPage.scss';

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
  const inProgress = runs.filter((run) =>
    ['queued', 'running', 'stopping'].includes(run.status)
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
          {runs.map((run) => (
            <RunCard
              key={run.run_id}
              run={run}
              isCancelling={cancellingRunId === run.run_id}
              onStopOrCancel={(selectedRun) => void stopOrCancel(selectedRun)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
