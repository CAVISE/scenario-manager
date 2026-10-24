import {
  AssessmentOutlined,
  CancelOutlined,
  StopCircleOutlined,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import type { SimulationRun } from '@/features/simulation-runs';

const statusLabel: Record<SimulationRun['status'], string> = {
  queued: 'Queued',
  running: 'Running',
  stopping: 'Stopping',
  finished: 'Completed',
  error: 'Failed',
  cancelled: 'Cancelled',
  idle: 'Idle',
};

export const formatRunDate = (value?: number | null) =>
  value
    ? new Date(value * 1000).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Just now';

interface RunCardProps {
  run: SimulationRun;
  isCancelling: boolean;
  onStopOrCancel: (run: SimulationRun) => void;
}

export function RunCard({ run, isCancelling, onStopOrCancel }: RunCardProps) {
  const cancellable = run.status === 'queued' || run.status === 'running';
  const progress = run.max_ticks > 0 ? Math.min(run.tick, run.max_ticks) : 0;

  return (
    <article className="workspace-run-card">
      <div className="workspace-run-card__identity">
        <span className={`workspace-run-status is-${run.status}`}>
          {statusLabel[run.status]}
        </span>
        <div>
          <h2>
            <Link to={`/runs/${encodeURIComponent(run.run_id)}`}>
              {run.scenario_name || 'Untitled scenario'}
            </Link>
          </h2>
          <p>
            {run.map || 'Map not specified'} · {formatRunDate(run.modified_at)}
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
              {run.tick.toLocaleString()} / {run.max_ticks.toLocaleString()}{' '}
              steps
            </span>
            <progress max={run.max_ticks} value={progress} />
          </label>
        ) : null}
        {run.partial ? <span>Stopped early</span> : null}
        {run.error ? (
          <span className="workspace-run-card__error">{run.error}</span>
        ) : null}
      </div>
      <div className="workspace-run-card__actions">
        <Link
          className="workspace-secondary workspace-run-card__details"
          to={`/runs/${encodeURIComponent(run.run_id)}`}
        >
          Details
        </Link>
        {cancellable ? (
          <button
            type="button"
            className="workspace-secondary workspace-run-card__stop"
            disabled={isCancelling}
            onClick={() => onStopOrCancel(run)}
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
}
