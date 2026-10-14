import { ScienceOutlined } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useSimulationRuns } from '@/features/simulation-runs';

const displayName = (
  scenarioName?: string | null,
  scenarioId?: string | null
) => scenarioName || scenarioId || 'Untitled scenario';

export default function ExperimentCenterPage() {
  const { runs, isLoading, error, refresh } = useSimulationRuns();
  const groups = runs.reduce<
    Map<
      string,
      { name: string; total: number; completed: number; active: number }
    >
  >((result, run) => {
    const key = run.scenario_id || run.scenario_name || run.run_id;
    const current = result.get(key) ?? {
      name: displayName(run.scenario_name, run.scenario_id),
      total: 0,
      completed: 0,
      active: 0,
    };
    current.total += 1;
    current.completed += run.status === 'finished' ? 1 : 0;
    current.active +=
      run.status === 'queued' ||
      run.status === 'running' ||
      run.status === 'stopping'
        ? 1
        : 0;
    result.set(key, current);
    return result;
  }, new Map());

  return (
    <section className="workspace-research-page">
      <div className="workspace-page-heading">
        <div>
          <span className="workspace-kicker">RESEARCH MANAGEMENT</span>
          <h1>Experiments</h1>
          <p>
            Review batches of simulation evidence before the full
            parameter-sweep workflow is added.
          </p>
        </div>
        <Link className="workspace-primary" to="/editor">
          Open editor
        </Link>
      </div>

      <div className="workspace-research-intro">
        <ScienceOutlined aria-hidden="true" />
        <div>
          <strong>Experiment Center is taking shape</strong>
          <p>
            Today, runs are grouped by their source scenario. Dedicated
            experiment versions, parameter sweeps and seed sets will be
            persisted in the next backend layer.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="workspace-empty workspace-empty--loading" role="status">
          <span className="workspace-empty__icon" aria-hidden="true">
            <ScienceOutlined />
          </span>
          <strong>Loading run groups</strong>
          <p>Collecting current simulation history…</p>
        </div>
      ) : error ? (
        <div className="workspace-empty" role="alert">
          <strong>Could not load simulation groups</strong>
          <p>The backend may still be starting.</p>
          <button
            type="button"
            className="workspace-secondary"
            onClick={() => void refresh()}
          >
            Try again
          </button>
        </div>
      ) : !groups.size ? (
        <div className="workspace-empty">
          <span className="workspace-empty__icon" aria-hidden="true">
            <ScienceOutlined />
          </span>
          <strong>No run groups yet</strong>
          <p>
            Launch a scenario to create the first unit of research evidence.
          </p>
          <Link
            className="workspace-primary workspace-empty__action"
            to="/editor"
          >
            Open editor
          </Link>
        </div>
      ) : (
        <div className="workspace-experiment-list">
          {[...groups.values()].map((group) => (
            <article className="workspace-experiment-card" key={group.name}>
              <div>
                <span className="workspace-kicker">SCENARIO RUN GROUP</span>
                <h2>{group.name}</h2>
                <p>
                  {group.total} run{group.total === 1 ? '' : 's'} recorded
                </p>
              </div>
              <dl>
                <div>
                  <dt>Completed</dt>
                  <dd>{group.completed}</dd>
                </div>
                <div>
                  <dt>In progress</dt>
                  <dd>{group.active}</dd>
                </div>
              </dl>
              <Link className="workspace-secondary" to="/runs">
                View runs
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
