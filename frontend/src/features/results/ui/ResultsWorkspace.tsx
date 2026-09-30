import { useState } from 'react';
import { AssessmentOutlined, RefreshOutlined } from '@mui/icons-material';
import { useResultsRuns } from '../model/useResultsRuns';
import { RunDetails } from '../components/RunDetails';
import type { ResultsWorkspaceProps } from '../types/results';
import '../styles/Results.scss';

const categories = [
  ['motion', 'Movement'],
  ['localization', 'Localization'],
  ['safety', 'Safety'],
  ['cooperation', 'RSU cooperation'],
  ['platooning', 'Platooning'],
] as const;

const timestamp = (value: number) =>
  new Date(value * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export default function ResultsWorkspace({
  onOpenContext,
  preferredRunId,
}: ResultsWorkspaceProps) {
  const [category, setCategory] = useState('all');
  const {
    runs,
    selected,
    responses,
    loading,
    runsError,
    filesError,
    refreshResults,
    toggleRun,
  } = useResultsRuns(preferredRunId);

  return (
    <div
      className="results-workspace"
      role="tabpanel"
      aria-label="Results workspace"
    >
      <header className="results-heading">
        <div>
          <span className="rp-workspace-kicker">SIMULATION INSIGHTS</span>
          <h2>Explore results</h2>
          <p>
            Understand vehicle behaviour, inspect measurements and compare runs.
          </p>
        </div>
        <button
          type="button"
          className="results-refresh"
          aria-label="Refresh results"
          disabled={loading}
          onClick={refreshResults}
        >
          <RefreshOutlined fontSize="small" />
          Refresh
        </button>
      </header>
      <div className="results-layout">
        <aside className="results-history" aria-label="Run history">
          <h3>
            Run history <span>{runs.length}</span>
          </h3>
          <p>Select up to two runs to compare.</p>
          <div
            className="results-history-list"
            role="region"
            aria-label="Experiments"
            tabIndex={0}
          >
            {runs.map((run) => (
              <button
                key={run.run_id}
                className="results-run-choice"
                type="button"
                aria-pressed={selected.includes(run.run_id)}
                onClick={() => toggleRun(run.run_id)}
              >
                <strong>{run.scenario_name || run.run_id}</strong>
                <span>{timestamp(run.modified_at)}</span>
                <small>
                  {run.is_demo
                    ? 'Demo data'
                    : run.outcome === 'partial'
                      ? 'Partial run'
                      : run.outcome === 'complete'
                        ? 'Completed'
                        : 'Archived'}{' '}
                  · {run.files_count} files
                </small>
              </button>
            ))}
          </div>
        </aside>
        <div
          className="results-content"
          role="region"
          aria-label="Experiment results"
          tabIndex={0}
        >
          {loading && (
            <div className="results-callout" role="status">
              Loading result files...
            </div>
          )}
          {(runsError || filesError) && (
            <div className="rp-results-error" role="alert">
              {runsError || filesError}
            </div>
          )}
          {!loading && !runsError && !runs.length && (
            <div className="results-empty">
              <AssessmentOutlined />
              <h3>No completed runs yet</h3>
              <p>
                Run your scenario to collect vehicle measurements, safety events
                and route data.
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
          {!loading && runs.length > 0 && !selected.length && (
            <div className="results-empty">
              <h3>No completed run selected</h3>
              <p>Select a run from the history to explore its results.</p>
            </div>
          )}
          {!!responses.length && !loading && (
            <>
              {selected.length === 2 && (
                <div className="results-callout">
                  Comparing two runs side by side. Select a vehicle in each run;
                  actor IDs can change between runs.
                </div>
              )}
              {responses.some((response) => response.data) && (
                <div
                  className="results-categories"
                  role="group"
                  aria-label="Chart category"
                >
                  {[['all', 'All charts'], ...categories].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={category === id}
                      onClick={() => setCategory(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div
                className={`results-run-columns${responses.length > 1 ? ' comparing' : ''}`}
              >
                {responses.map((response) => {
                  const run = runs.find(
                    (item) => item.run_id === response.run_id
                  );
                  return run ? (
                    <RunDetails
                      key={response.run_id}
                      run={run}
                      response={response}
                      category={category}
                    />
                  ) : null;
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
