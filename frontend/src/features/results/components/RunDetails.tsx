import { useState } from 'react';
import { API_URL } from '@/VARS';
import ResultChart from '../ui/ResultChart';
import type { RunDetailsProps } from '../types/results';

const highlights = [
  'distance',
  'destination_distance',
  'collision_detected',
  'rsu_coverage',
];

const timestamp = (value: number) =>
  new Date(value * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const number = (value: number | null | undefined, unit = '') =>
  value == null
    ? '—'
    : `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`;

export function RunDetails({ run, response, category }: RunDetailsProps) {
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
