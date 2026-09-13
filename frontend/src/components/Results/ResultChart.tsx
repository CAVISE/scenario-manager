import { useId, useMemo, useState } from 'react';
import type { ResultChart as Chart } from './types';

const COLORS = ['#3979db', '#ce6728', '#159885', '#aa62d4'];
const LEFT = 68;
const TOP = 22;
const WIDTH = 584;
const HEIGHT = 218;
const format = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const axisLabel = (axis: Chart['x_axis']) =>
  `${axis.label}${axis.unit ? ` (${axis.unit})` : ''}`;

export default function ResultChart({ chart }: { chart: Chart }) {
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
  const geometry = useMemo(() => {
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
      // Equal physical scale on both axes, so routes are not distorted.
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
  }, [chart.kind, visible]);
  const selectedLine = active ? chart.series[active.line] : null;
  const selectedPoint = active ? selectedLine?.points[active.point] : null;

  return (
    <article className="result-chart" aria-labelledby={`${id}-title`}>
      <div className="result-chart-heading">
        <h3 id={`${id}-title`}>{chart.title}</h3>
        <span>
          {chart.kind === 'trajectory'
            ? 'Spatial view'
            : chart.kind === 'step'
              ? 'Event timeline'
              : 'Recorded samples'}
        </span>
      </div>
      <p>{chart.description}</p>
      <div className="result-chart-legend" aria-label={`${chart.title} series`}>
        {chart.series.map((line, index) => (
          <button
            key={line.id}
            type="button"
            aria-pressed={!hidden.includes(line.id)}
            onClick={() => {
              setHidden((current) =>
                current.includes(line.id)
                  ? current.filter((key) => key !== line.id)
                  : [...current, line.id]
              );
              setActive(null);
            }}
          >
            <i style={{ background: COLORS[index % COLORS.length] }} />
            {line.label}
          </button>
        ))}
      </div>
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
                {format(
                  geometry.yMax - (tick * (geometry.yMax - geometry.yMin)) / 4
                )}
              </text>
              <text x={x} y={TOP + HEIGHT + 22} textAnchor="middle">
                {format(
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
            <g key={line.id}>
              <path
                d={geometry.paths[index]}
                fill="none"
                stroke={COLORS[line.index % COLORS.length]}
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
                      fill={COLORS[line.index % COLORS.length]}
                    />
                  )
              )}
            </g>
          ))}
          {selectedPoint && selectedPoint[1] !== null && (
            <circle
              cx={geometry.sx(selectedPoint[0])}
              cy={geometry.sy(selectedPoint[1])}
              r={5}
              fill={COLORS[(active?.line ?? 0) % COLORS.length]}
              stroke="var(--workspace-surface)"
              strokeWidth={2}
            />
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
      <div className="result-chart-readout" aria-live="polite">
        {selectedPoint && selectedPoint[1] !== null
          ? `${selectedLine?.label} · ${format(selectedPoint[0])} ${chart.x_axis.unit} → ${format(selectedPoint[1])} ${chart.y_axis.unit}`
          : 'Hover over the chart or focus it and use ← → to inspect values.'}
      </div>
      <details className="result-chart-table">
        <summary>View sample data</summary>
        <p>
          First 100 samples per series. Download charts.json for the full
          dataset.
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
                    <td>{format(x)}</td>
                    <td>{y === null ? 'Unavailable' : format(y)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}
