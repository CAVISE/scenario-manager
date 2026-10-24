import type { ResultChart } from '../types/results';
import { axisLabel, formatChartValue } from '../model/resultChartGeometry';

type ResultChartDataTableProps = {
  chart: ResultChart;
  visible: (ResultChart['series'][number] & { index: number })[];
};

export const ResultChartDataTable = ({
  chart,
  visible,
}: ResultChartDataTableProps) => (
  <details className="result-chart-table">
    <summary>View sample data</summary>
    <p>
      First 100 samples per series. Download charts.json for the full dataset.
    </p>
    <div>
      <table>
        <thead>
          <tr>
            <th>Series</th>
            <th>{axisLabel(chart.x_axis)}</th>
            <th>{axisLabel(chart.y_axis)}</th>
          </tr>
        </thead>
        <tbody>
          {visible.flatMap((line) =>
            line.points.slice(0, 100).map(([x, y], index) => (
              <tr key={`${line.id}-${index}`}>
                <td>{line.label}</td>
                <td>{formatChartValue(x)}</td>
                <td>{y === null ? 'Unavailable' : formatChartValue(y)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </details>
);

type ResultChartReadoutProps = {
  chart: ResultChart;
  label?: string;
  point?: [number, number | null] | null;
};

export const ResultChartReadout = ({
  chart,
  label,
  point,
}: ResultChartReadoutProps) => (
  <div className="result-chart-readout" aria-live="polite">
    {point?.[1] !== null && point
      ? `${label} · ${formatChartValue(point[0])} ${chart.x_axis.unit} → ${formatChartValue(point[1])} ${chart.y_axis.unit}`
      : 'Hover over the chart or focus it and use ← → to inspect values.'}
  </div>
);
