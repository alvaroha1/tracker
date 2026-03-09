type PieSlice = {
  label: string;
  value: number;
};

type ColoredPieSlice = PieSlice & {
  color: string;
};

type PieChartProps = {
  title: string;
  slices: PieSlice[];
  emptyMessage: string;
};

const PALETTE = [
  '#264653',
  '#2a9d8f',
  '#e9c46a',
  '#f4a261',
  '#e76f51',
  '#3d405b',
  '#6c757d',
];

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function arcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function toChartSlices(rawSlices: PieSlice[]): ColoredPieSlice[] {
  return rawSlices.map((slice, index) => ({
    label: slice.label,
    value: slice.value,
    color: PALETTE[index % PALETTE.length],
  }));
}

export function PieChart({ title, slices, emptyMessage }: PieChartProps) {
  const safeSlices = slices.filter((slice) => slice.value > 0);
  const total = safeSlices.reduce((sum, slice) => sum + slice.value, 0);

  if (total <= 0) {
    return (
      <article className="metric-card">
        <h3>{title}</h3>
        <p className="metric-subtext">{emptyMessage}</p>
      </article>
    );
  }

  const chartSlices = toChartSlices(safeSlices);
  const radius = 64;
  const cx = 80;
  const cy = 80;

  let startAngle = -Math.PI / 2;

  return (
    <article className="metric-card">
      <h3>{title}</h3>
      <div className="pie-chart-layout">
        <svg viewBox="0 0 160 160" className="pie-chart-svg" role="img" aria-label={title}>
          {chartSlices.map((slice) => {
            const sliceAngle = (slice.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;
            const path = arcPath(cx, cy, radius, startAngle, endAngle);
            startAngle = endAngle;

            return <path key={slice.label} d={path} fill={slice.color} />;
          })}
        </svg>

        <ul className="pie-chart-legend">
          {chartSlices.map((slice) => {
            const pct = (slice.value / total) * 100;
            return (
              <li key={slice.label}>
                <span className="legend-dot" style={{ background: slice.color }} />
                <span>{slice.label}</span>
                <span>{pct.toFixed(1)}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
