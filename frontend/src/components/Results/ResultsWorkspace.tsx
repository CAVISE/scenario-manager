import { useEffect, useState } from 'react';
import { AssessmentOutlined, RefreshOutlined } from '@mui/icons-material';
import { api } from '@/api/client';
import { API_URL } from '@/VARS';
import { useEditorStore } from '@/store';
import ResultChart from './ResultChart';
import type { ResultResponse, ResultRun } from './types';
import './Results.scss';

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
const number = (value: number | null | undefined, unit = '') =>
  value == null
    ? '—'
    : `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`;

function RunDetails({
  run,
  response,
  category,
}: {
  run: ResultRun;
  response: ResultResponse;
  category: string;
}) {
  const data = response.data;
  const [actorId, setActorId] = useState(data?.actors[0]?.id ?? '');
  const actor =
    data?.actors.find((item) => item.id === actorId) ?? data?.actors[0];
  const charts =
    data?.charts.filter(
      (chart) =>
        chart.actor_id === actor?.id &&
        (category === 'all' || chart.category === category)
    ) ?? [];
  const highlights = [
    'distance',
    'destination_distance',
    'collision_detected',
    'rsu_coverage',
  ];
  return (
    <section
      className="results-run-detail"
      aria-label={`Results for ${run.run_id}`}
    >
      <div className="results-run-title">
        <div>
          <h3>{run.scenario_name || run.run_id}</h3>
          <p>
            {timestamp(run.modified_at)} · {run.run_id}
          </p>
        </div>
        <span
          className={`results-outcome ${run.outcome === 'partial' ? 'partial' : ''}`}
        >
          {run.is_demo
            ? 'Demo data'
            : run.outcome === 'partial'
              ? 'Stopped early'
              : run.outcome === 'complete'
                ? 'Completed'
                : 'Archived run'}
        </span>
      </div>
      {run.outcome === 'partial' && (
        <div className="results-callout">
          This run was stopped early. Charts include only the steps completed
          before stopping.
        </div>
      )}
      {response.data_error && (
        <div className="rp-results-error" role="alert">
          {response.data_error}
        </div>
      )}
      {data ? (
        <>
          <dl className="results-summary">
            <div>
              <dt>Simulation time</dt>
              <dd>{number(data.elapsed_seconds, 's')}</dd>
            </div>
            <div>
              <dt>Recorded vehicles</dt>
              <dd>{data.actors.length}</dd>
            </div>
            <div>
              <dt>Completed steps</dt>
              <dd>
                {number(run.tick)}
                {run.max_ticks ? (
                  <small> / {number(run.max_ticks)}</small>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>Step duration</dt>
              <dd>{number(data.fixed_delta_seconds, 's')}</dd>
            </div>
          </dl>
          {data.warnings.map((warning, index) => (
            <div className="results-callout" key={index}>
              {warning}
            </div>
          ))}
          {data.actors.length > 0 && (
            <div className="results-vehicle-picker">
              <label>
                Vehicle
                <select
                  value={actor?.id ?? ''}
                  onChange={(event) => setActorId(event.target.value)}
                  aria-label={`Vehicle for ${run.run_id}`}
                >
                  {data.actors.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <span>
                {charts.length} charts · Click a legend to show or hide a series
              </span>
            </div>
          )}
          {actor && (
            <dl className="results-summary results-metrics">
              {actor.metrics
                .filter((item) => highlights.includes(item.id))
                .map((item) => (
                  <div key={item.id}>
                    <dt>{item.label}</dt>
                    <dd>
                      {item.id === 'collision_detected' && item.value != null
                        ? item.value
                          ? 'Yes'
                          : 'No'
                        : number(item.value, item.unit)}
                    </dd>
                  </div>
                ))}
            </dl>
          )}
          {charts.length ? (
            <div className="results-chart-grid">
              {charts.map((chart) => (
                <ResultChart key={`${actor?.id}-${chart.id}`} chart={chart} />
              ))}
            </div>
          ) : (
            <div className="results-callout">
              No recorded samples for this vehicle in this category.
            </div>
          )}
          {!!actor?.metrics.length && (
            <details className="results-all-metrics">
              <summary>All vehicle metrics</summary>
              <dl>
                {actor.metrics.map((item) => (
                  <div key={item.id}>
                    <dt>{item.label}</dt>
                    <dd>{number(item.value, item.unit)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </>
      ) : (
        !response.data_error && (
          <div className="results-callout">
            This archived run has no interactive chart data. Its original files
            are available below. Run the scenario again to collect interactive
            charts.
          </div>
        )
      )}
      <details className="results-downloads" open={!data}>
        <summary>Downloads · {response.files.length} files</summary>
        <p>Full chart samples, metrics, logs and the scenario configuration.</p>
        <div className="results-file-list">
          {response.files.map((file) => (
            <a
              key={file.filename}
              href={`${API_URL.replace(/\/$/, '')}${file.url}`}
              target="_blank"
              rel="noreferrer"
            >
              {file.filename}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        {!response.files.length && <p>No result files found</p>}
      </details>
    </section>
  );
}

export default function ResultsWorkspace({
  onOpenContext,
}: {
  onOpenContext: () => void;
}) {
  const runId = useEditorStore((state) => state.simulationSession.runId);
  const phase = useEditorStore((state) => state.simulationSession.phase);
  const [runs, setRuns] = useState<ResultRun[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [responses, setResponses] = useState<ResultResponse[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [category, setCategory] = useState('all');
  const loading = runsLoading || filesLoading;

  useEffect(() => {
    const controller = new AbortController();
    setRunsLoading(true);
    setRunsError(null);
    api
      .get('api/results', { signal: controller.signal })
      .json<ResultRun[]>()
      .then((items) => {
        if (controller.signal.aborted) return;
        setRuns(items);
        setSelected((current) => {
          const retained = current.filter((id) =>
            items.some((item) => item.run_id === id)
          );
          if (retained.length) return retained;
          const preferred =
            items.find((item) => item.run_id === runId) ?? items[0];
          return preferred ? [preferred.run_id] : [];
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setRuns([]);
        setSelected([]);
        setResponses([]);
        setRunsError('Could not load run history. Refresh to try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setRunsLoading(false);
      });
    return () => controller.abort();
  }, [runId, phase, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    setResponses([]);
    setFilesError(null);
    setFilesLoading(false);
    if (!selected.length) return () => controller.abort();
    setFilesLoading(true);
    Promise.all(
      selected.map((id) =>
        api
          .get(`api/results/${encodeURIComponent(id)}`, {
            signal: controller.signal,
          })
          .json<ResultResponse>()
      )
    )
      .then((items) => {
        if (!controller.signal.aborted) setResponses(items);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setFilesError('Could not load result files. Refresh to try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setFilesLoading(false);
      });
    return () => controller.abort();
  }, [selected, refresh]);

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
          onClick={() => setRefresh((value) => value + 1)}
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
                onClick={() =>
                  setSelected((current) =>
                    current.includes(run.run_id)
                      ? current.filter((id) => id !== run.run_id)
                      : [...current.slice(-1), run.run_id]
                  )
                }
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
