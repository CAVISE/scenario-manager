import type { ResultChart } from '../types/results';
import { colorClass } from '../model/resultChartGeometry';

type ResultChartLegendProps = {
  title: string;
  series: ResultChart['series'];
  hidden: string[];
  onToggle: (seriesId: string) => void;
};

export const ResultChartLegend = ({
  title,
  series,
  hidden,
  onToggle,
}: ResultChartLegendProps) => (
  <div className="result-chart-legend" aria-label={`${title} series`}>
    {series.map((line, index) => (
      <button
        key={line.id}
        type="button"
        aria-pressed={!hidden.includes(line.id)}
        onClick={() => onToggle(line.id)}
      >
        <i className={colorClass(index)} />
        {line.label}
      </button>
    ))}
  </div>
);
