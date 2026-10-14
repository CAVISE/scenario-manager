import { HistoryOutlined, PlayCircleOutline } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useSimulationRuns } from '@/features/simulation-runs';

const formatDate = (value?: number | null) =>
  value ? new Date(value * 1000).toLocaleString() : 'Recently completed';

export default function ReplayPage() {
  const { runs, isLoading } = useSimulationRuns();
  const completedRuns = runs.filter((run) => run.status === 'finished');

  return (
    <section className="workspace-research-page">
      <div className="workspace-page-heading">
        <div>
          <span className="workspace-kicker">SIMULATION EVIDENCE</span>
          <h1>Replay</h1>
          <p>
            Replay-ready runs will join trajectories, events and metrics in one
            investigation surface.
          </p>
        </div>
      </div>
      <div className="workspace-replay-stage">
        <HistoryOutlined aria-hidden="true" />
        <div>
          <span className="workspace-kicker">NEXT CAPABILITY</span>
          <h2>Time-indexed 3D playback</h2>
          <p>
            Position recording has not been added to the simulation worker yet.
            Until then, open existing metrics and artifacts from a completed
            run.
          </p>
        </div>
      </div>
      <div className="workspace-section-heading">
        <div>
          <span className="workspace-kicker">AVAILABLE NOW</span>
          <h2>Completed runs</h2>
        </div>
        <Link to="/runs">View all runs →</Link>
      </div>
      {isLoading ? (
        <div className="workspace-empty workspace-empty--loading" role="status">
          <strong>Loading completed runs</strong>
        </div>
      ) : !completedRuns.length ? (
        <div className="workspace-empty">
          <span className="workspace-empty__icon" aria-hidden="true">
            <PlayCircleOutline />
          </span>
          <strong>No completed runs</strong>
          <p>
            Results and future replay records will appear after a simulation
            finishes.
          </p>
        </div>
      ) : (
        <div className="workspace-replay-list">
          {completedRuns.slice(0, 8).map((run) => (
            <article key={run.run_id}>
              <div>
                <strong>{run.scenario_name || 'Untitled scenario'}</strong>
                <span>
                  {run.map || 'Map not specified'} ·{' '}
                  {formatDate(run.modified_at)}
                </span>
              </div>
              <Link
                className="workspace-secondary"
                to={`/editor?workspace=results&run=${encodeURIComponent(run.run_id)}`}
              >
                Open results
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
