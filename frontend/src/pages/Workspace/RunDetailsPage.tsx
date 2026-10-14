import {
  ArticleOutlined,
  DownloadOutlined,
  ImageOutlined,
  RefreshOutlined,
  TerminalOutlined,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { API_URL } from '@/VARS';
import { simulationRunsApi } from '@/features/simulation-runs/api/simulationRunsApi';
import type {
  RunArtifact,
  SimulationRunStatus,
} from '@/features/simulation-runs';
import './styles/RunsPage.scss';

const statusLabel: Record<SimulationRunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  stopping: 'Stopping',
  finished: 'Completed',
  error: 'Failed',
  cancelled: 'Cancelled',
  idle: 'Idle',
};

const formattedDate = (value?: number | null) =>
  value
    ? new Date(value * 1000).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

const formattedBytes = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const artifactIcon = (artifact: RunArtifact) =>
  artifact.kind === 'image' ? (
    <ImageOutlined />
  ) : artifact.kind === 'log' ? (
    <TerminalOutlined />
  ) : (
    <ArticleOutlined />
  );

export default function RunDetailsPage() {
  const { runId = '' } = useParams();
  const detail = useQuery({
    queryKey: ['simulation-run', runId],
    queryFn: () => simulationRunsApi.detail(runId),
    enabled: Boolean(runId),
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ||
      query.state.data?.status === 'queued'
        ? 3_000
        : false,
  });
  const run = detail.data;

  if (detail.isLoading)
    return (
      <section
        className="workspace-empty workspace-empty--loading"
        role="status"
      >
        <strong>Loading run details</strong>
      </section>
    );
  if (detail.isError || !run)
    return (
      <section className="workspace-empty" role="alert">
        <strong>Could not load this run</strong>
        <p>The run may have been removed, or the backend is unavailable.</p>
        <Link
          className="workspace-secondary workspace-empty__action"
          to="/runs"
        >
          Back to runs
        </Link>
      </section>
    );

  return (
    <section className="workspace-run-details">
      <div className="workspace-page-heading">
        <div>
          <span className="workspace-kicker">RUN DETAILS</span>
          <h1>{run.scenario_name || 'Untitled scenario'}</h1>
          <p>
            {run.map || 'Map not specified'} · {run.run_id}
          </p>
        </div>
        <div className="workspace-run-detail-actions">
          <button
            type="button"
            className="workspace-secondary"
            onClick={() => void detail.refetch()}
          >
            <RefreshOutlined /> Refresh
          </button>
          {run.status === 'finished' && run.has_results ? (
            <Link
              className="workspace-primary"
              to={`/editor?workspace=results&run=${encodeURIComponent(run.run_id)}`}
            >
              Open metrics
            </Link>
          ) : null}
        </div>
      </div>

      <div className="workspace-run-detail-summary">
        <div>
          <span className={`workspace-run-status is-${run.status}`}>
            {statusLabel[run.status]}
          </span>
          <small>Current state</small>
        </div>
        <div>
          <strong>
            {run.tick.toLocaleString()} / {run.max_ticks.toLocaleString()}
          </strong>
          <small>Simulation steps</small>
        </div>
        <div>
          <strong>{formattedDate(run.created_at)}</strong>
          <small>Created</small>
        </div>
        <div>
          <strong>{run.artifacts.length}</strong>
          <small>Artifacts</small>
        </div>
      </div>

      {run.error ? (
        <div className="workspace-run-error" role="alert">
          <strong>Run error</strong>
          <span>{run.error}</span>
        </div>
      ) : null}

      <div className="workspace-run-detail-grid">
        <article className="workspace-detail-panel">
          <div className="workspace-detail-panel__heading">
            <div>
              <span className="workspace-kicker">CONFIGURATION</span>
              <h2>Run snapshot</h2>
            </div>
          </div>
          <dl className="workspace-run-config">
            {Object.entries(run.configuration)
              .filter(([key]) =>
                ['map_name', 'max_ticks', 'current_time', 'run_id'].includes(
                  key
                )
              )
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replace(/_/g, ' ')}</dt>
                  <dd>{String(value ?? '—')}</dd>
                </div>
              ))}
            {!Object.keys(run.configuration).length ? (
              <p>No runtime configuration was stored for this legacy run.</p>
            ) : null}
          </dl>
        </article>
        <article className="workspace-detail-panel">
          <div className="workspace-detail-panel__heading">
            <div>
              <span className="workspace-kicker">ACTIVITY</span>
              <h2>Run context</h2>
            </div>
          </div>
          <dl className="workspace-run-config">
            <div>
              <dt>Scenario</dt>
              <dd>{run.scenario_name || '—'}</dd>
            </div>
            <div>
              <dt>Scenario ID</dt>
              <dd>{run.scenario_id || '—'}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formattedDate(run.modified_at)}</dd>
            </div>
            <div>
              <dt>Queue position</dt>
              <dd>{run.queue_position ?? '—'}</dd>
            </div>
          </dl>
        </article>
      </div>

      <section
        className="workspace-artifact-explorer"
        aria-labelledby="artifact-title"
      >
        <div className="workspace-section-heading">
          <div>
            <span className="workspace-kicker">ARTIFACT EXPLORER</span>
            <h2 id="artifact-title">Results and diagnostics</h2>
          </div>
          <span className="workspace-count">
            {run.artifacts.length} available
          </span>
        </div>
        {run.artifacts.length ? (
          <div className="workspace-artifact-list">
            {run.artifacts.map((artifact) => (
              <article key={artifact.filename}>
                <span className="workspace-artifact-icon">
                  {artifactIcon(artifact)}
                </span>
                <div>
                  <strong>{artifact.filename}</strong>
                  <span>
                    {artifact.kind} · {formattedBytes(artifact.size_bytes)} ·{' '}
                    {formattedDate(artifact.modified_at)}
                  </span>
                </div>
                <a
                  className="workspace-secondary"
                  href={`${API_URL.replace(/\/$/, '')}${artifact.url}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <DownloadOutlined /> Download
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="workspace-empty">
            <strong>No artifacts yet</strong>
            <p>
              Files will appear here as the simulation writes results, logs and
              configurations.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
