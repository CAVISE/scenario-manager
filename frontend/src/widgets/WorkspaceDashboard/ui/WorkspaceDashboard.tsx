import {
  AssessmentOutlined,
  HubOutlined,
  PlayCircleOutline,
  StorageOutlined,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { useSimulationRuns } from '@/features/simulation-runs';
import './WorkspaceDashboard.scss';

type HealthResponse = { status: 'ok'; db: 'connected' };

interface WorkspaceDashboardProps {
  scenarioName: string;
  scenariosCount: number;
  scenariosLoading: boolean;
}

const isInProgress = (status: string) =>
  status === 'queued' || status === 'running' || status === 'stopping';

export function WorkspaceDashboard({
  scenarioName,
  scenariosCount,
  scenariosLoading,
}: WorkspaceDashboardProps) {
  const { runs, isLoading: runsLoading } = useSimulationRuns();
  const health = useQuery({
    queryKey: ['workspace-health'],
    queryFn: () => api.get('health').json<HealthResponse>(),
    retry: false,
    refetchInterval: 30_000,
  });
  const activeRun = runs.find((run) => isInProgress(run.status));
  const latestCompletedRun = runs.find((run) => run.status === 'finished');
  const progress = activeRun?.max_ticks
    ? Math.min(activeRun.tick, activeRun.max_ticks)
    : 0;

  return (
    <section className="workspace-dashboard" aria-label="Workspace overview">
      <div className="workspace-section-heading">
        <div>
          <span className="workspace-kicker">WORKSPACE OVERVIEW</span>
          <h2>Pick up where you left off</h2>
        </div>
        <Link to="/runs">View all runs →</Link>
      </div>
      <div className="workspace-dashboard-grid">
        <Link
          className="workspace-dashboard-card workspace-dashboard-card--draft"
          to="/editor"
        >
          <span className="workspace-dashboard-card__icon" aria-hidden="true">
            <HubOutlined />
          </span>
          <span className="workspace-dashboard-card__eyebrow">
            CURRENT DRAFT
          </span>
          <strong>{scenarioName || 'Untitled scenario'}</strong>
          <span>
            {scenariosLoading
              ? 'Checking scenario library…'
              : `${scenariosCount} saved scenario${scenariosCount === 1 ? '' : 's'}`}
          </span>
          <small>Open editor →</small>
        </Link>

        <Link className="workspace-dashboard-card" to="/runs">
          <span className="workspace-dashboard-card__icon" aria-hidden="true">
            <PlayCircleOutline />
          </span>
          <span className="workspace-dashboard-card__eyebrow">
            SIMULATION CAPACITY
          </span>
          {runsLoading ? (
            <strong>Checking queue…</strong>
          ) : activeRun ? (
            <>
              <strong>
                {activeRun.status === 'queued'
                  ? 'Run queued'
                  : 'Simulation running'}
              </strong>
              <span>
                {activeRun.scenario_name || activeRun.map || activeRun.run_id}
              </span>
              {activeRun.max_ticks ? (
                <progress max={activeRun.max_ticks} value={progress} />
              ) : null}
            </>
          ) : (
            <>
              <strong>CARLA is available</strong>
              <span>No simulation is using the worker right now.</span>
            </>
          )}
          <small>Manage runs →</small>
        </Link>

        <div className="workspace-dashboard-card workspace-dashboard-card--system">
          <span className="workspace-dashboard-card__icon" aria-hidden="true">
            <StorageOutlined />
          </span>
          <span className="workspace-dashboard-card__eyebrow">
            SYSTEM STATUS
          </span>
          <strong>
            {health.isLoading
              ? 'Checking services…'
              : health.isSuccess
                ? 'Workspace online'
                : 'Status unavailable'}
          </strong>
          <span>
            {health.isSuccess
              ? 'API responding · Database connected'
              : 'Refresh this page after services are available.'}
          </span>
          {latestCompletedRun ? (
            <Link
              to={`/editor?workspace=results&run=${encodeURIComponent(latestCompletedRun.run_id)}`}
            >
              <AssessmentOutlined aria-hidden="true" />
              Latest results
            </Link>
          ) : (
            <small>Results will appear after the first completed run.</small>
          )}
        </div>
      </div>
    </section>
  );
}
