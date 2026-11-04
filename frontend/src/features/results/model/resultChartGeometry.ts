import type { ResultChart } from '../types/results';

export const LEFT = 68;
export const TOP = 22;
export const WIDTH = 584;
export const HEIGHT = 218;

type VisibleSeries = ResultChart['series'][number] & { index: number };

export const colorClass = (index: number) =>
  [
    'result-chart-color-blue',
    'result-chart-color-orange',
    'result-chart-color-green',
    'result-chart-color-purple',
  ][index % 4];

export const formatChartValue = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 2 });

export const axisLabel = (axis: ResultChart['x_axis']) =>
  `${axis.label}${axis.unit ? ` (${axis.unit})` : ''}`;

export function buildChartGeometry(
  chart: ResultChart,
  visible: VisibleSeries[]
) {
  let xMin = Infinity,
    xMax = -Infinity,
    yMin = Infinity,
    yMax = -Infinity;
  for (const line of visible) {
    for (const [x, y] of line.points) {
      if (y === null) continue;
      xMin = Math.min(xMin, x);
      xMax = Math.max(xMax, x);
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);
    }
  }
  const empty = !Number.isFinite(xMin);
  if (empty) {
    xMin = 0;
    xMax = 1;
    yMin = 0;
    yMax = 1;
  }
  if (xMin === xMax) {
    xMin -= 0.5;
    xMax += 0.5;
  }
  if (yMin === yMax) {
    yMin -= 0.5;
    yMax += 0.5;
  }
  const padding = (yMax - yMin) * 0.08;
  yMin -= padding;
  yMax += padding;
  if (chart.kind === 'trajectory') {
    const scale = Math.max((xMax - xMin) / WIDTH, (yMax - yMin) / HEIGHT);
    const cx = (xMin + xMax) / 2,
      cy = (yMin + yMax) / 2;
    xMin = cx - (scale * WIDTH) / 2;
    xMax = cx + (scale * WIDTH) / 2;
    yMin = cy - (scale * HEIGHT) / 2;
    yMax = cy + (scale * HEIGHT) / 2;
  }
  const sx = (x: number) => LEFT + ((x - xMin) / (xMax - xMin)) * WIDTH;
  const sy = (y: number) =>
    TOP + HEIGHT - ((y - yMin) / (yMax - yMin)) * HEIGHT;
  const paths = visible.map((line) => {
    let connected = false;
    return line.points
      .map(([x, y]) => {
        if (y === null) {
          connected = false;
          return '';
        }
        const command = connected
          ? chart.kind === 'step'
            ? `H${sx(x)}V`
            : `L${sx(x)},`
          : `M${sx(x)},`;
        connected = true;
        return `${command}${sy(y)}`;
      })
      .join(' ');
  });
  return { xMin, xMax, yMin, yMax, sx, sy, empty, paths };
}
