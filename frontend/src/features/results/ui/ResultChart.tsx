import { useId, useMemo, useState } from 'react';
import type { ResultChartProps } from '../types/results';
import {
  ResultChartDataTable,
  ResultChartReadout,
} from '../components/ResultChartDataTable';
import { ResultChartHeading } from '../components/ResultChartHeading';
import { ResultChartLegend } from '../components/ResultChartLegend';
import {
  axisLabel,
  buildChartGeometry,
  colorClass,
  formatChartValue,
  HEIGHT,
  LEFT,
  TOP,
  WIDTH,
} from '../model/resultChartGeometry';

export default function ResultChart({ chart }: ResultChartProps) {
  const id = useId();
  const [hidden, setHidden] = useState<string[]>([]);
  const [active, setActive] = useState<{ line: number; point: number } | null>(
    null
  );
  const visible = useMemo(
    () =>
      chart.series
        .map((line, index) => ({ ...line, index }))
        .filter((line) => !hidden.includes(line.id)),
    [chart, hidden]
  );
  const geometry = useMemo(
    () => buildChartGeometry(chart, visible),
    [chart, visible]
  );
  const selectedLine = active ? chart.series[active.line] : null;
  const selectedPoint = active ? selectedLine?.points[active.point] : null;

  return (
    <article className="result-chart" aria-labelledby={`${id}-title`}>
      <ResultChartHeading chart={chart} titleId={`${id}-title`} />
      <ResultChartLegend
        title={chart.title}
        series={chart.series}
        hidden={hidden}
        onToggle={(seriesId) => {
          setHidden((current) =>
            current.includes(seriesId)
              ? current.filter((id) => id !== seriesId)
              : [...current, seriesId]
          );
          setActive(null);
        }}
      />
      <svg
        viewBox="0 0 680 294"
        role="img"
        aria-label={`${chart.title}. ${axisLabel(chart.x_axis)}; ${axisLabel(chart.y_axis)}. Use arrow keys to inspect samples.`}
        tabIndex={0}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - bounds.left) / bounds.width) * 680;
          const y = ((event.clientY - bounds.top) / bounds.height) * 294;
          let best = Infinity;
          let nearest = null;
          visible.forEach((line) =>
            line.points.forEach(([px, py], point) => {
              if (py === null) return;
              const distance = Math.hypot(
                geometry.sx(px) - x,
                geometry.sy(py) - y
              );
              if (distance < best) {
                best = distance;
                nearest = { line: line.index, point };
              }
            })
          );
          setActive(nearest);
        }}
        onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
            return;
          event.preventDefault();
          const line =
            visible.find((item) => item.index === active?.line) ?? visible[0];
          if (!line?.points.length) return;
          const direction =
            event.key === 'ArrowLeft' || event.key === 'End' ? -1 : 1;
          let point =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? line.points.length - 1
                : active
                  ? active.point + direction
                  : 0;
          while (
            point >= 0 &&
            point < line.points.length &&
            line.points[point][1] === null
          )
            point += direction;
          if (point >= 0 && point < line.points.length)
            setActive({ line: line.index, point });
        }}
      >
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x={LEFT} y={TOP} width={WIDTH} height={HEIGHT} />
          </clipPath>
        </defs>
        {[0, 1, 2, 3, 4].map((tick) => {
          const x = LEFT + (tick * WIDTH) / 4,
            y = TOP + (tick * HEIGHT) / 4;
          return (
            <g key={tick} className="result-chart-axis">
              <line x1={LEFT} y1={y} x2={LEFT + WIDTH} y2={y} />
              <text x={LEFT - 10} y={y + 4} textAnchor="end">
                {formatChartValue(
                  geometry.yMax - (tick * (geometry.yMax - geometry.yMin)) / 4
                )}
              </text>
              <text x={x} y={TOP + HEIGHT + 22} textAnchor="middle">
                {formatChartValue(
                  geometry.xMin + (tick * (geometry.xMax - geometry.xMin)) / 4
                )}
              </text>
            </g>
          );
        })}
        <text
          className="result-chart-axis-label"
          x={LEFT + WIDTH / 2}
          y={286}
          textAnchor="middle"
        >
          {axisLabel(chart.x_axis)}
        </text>
        <text
          className="result-chart-axis-label"
          transform={`translate(16 ${TOP + HEIGHT / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          {axisLabel(chart.y_axis)}
        </text>
        <g clipPath={`url(#${id}-clip)`}>
          {visible.map((line, index) => (
            <g
              key={line.id}
              className={`result-chart-series ${colorClass(line.index)}`}
            >
              <path
                d={geometry.paths[index]}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {line.points.map(
                ([x, y], point) =>
                  y !== null &&
                  line.points[point - 1]?.[1] == null &&
                  line.points[point + 1]?.[1] == null && (
                    <circle
                      key={point}
                      cx={geometry.sx(x)}
                      cy={geometry.sy(y)}
                      r={4}
                    />
                  )
              )}
            </g>
          ))}
          {selectedPoint && selectedPoint[1] !== null && (
            <>
              <line
                className="result-chart-cursor"
                x1={geometry.sx(selectedPoint[0])}
                x2={geometry.sx(selectedPoint[0])}
                y1={TOP}
                y2={TOP + HEIGHT}
              />
              <circle
                cx={geometry.sx(selectedPoint[0])}
                cy={geometry.sy(selectedPoint[1])}
                r={5}
                strokeWidth={2}
                className={`result-chart-selected ${colorClass(active?.line ?? 0)}`}
              />
            </>
          )}
        </g>
        {geometry.empty && (
          <text
            className="result-chart-axis-label"
            x={LEFT + WIDTH / 2}
            y={TOP + HEIGHT / 2}
            textAnchor="middle"
          >
            No visible measurements
          </text>
        )}
      </svg>
      <ResultChartReadout
        chart={chart}
        label={selectedLine?.label}
        point={selectedPoint}
      />
      <ResultChartDataTable chart={chart} visible={visible} />
    </article>
  );
}
