import type { ResultChart } from '../types/results';

type ResultChartHeadingProps = {
  chart: ResultChart;
  titleId: string;
};

export const ResultChartHeading = ({
  chart,
  titleId,
}: ResultChartHeadingProps) => (
  <>
    <div className="result-chart-heading">
      <h3 id={titleId}>{chart.title}</h3>
      <span>
        {chart.kind === 'trajectory'
          ? 'Spatial view'
          : chart.kind === 'step'
            ? 'Event timeline'
            : 'Recorded samples'}
      </span>
    </div>
    <p>{chart.description}</p>
  </>
);
