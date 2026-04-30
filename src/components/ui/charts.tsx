type SeriesItem = {
  label: string;
  score: number;
  status?: string;
};

export function LineChart({ data }: { data: SeriesItem[] }) {
  const width = 640;
  const height = 240;
  const padding = 34;
  const max = 100;
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
    const y = height - padding - (item.score / max) * (height - padding * 2);
    return { x, y, ...item };
  });

  return (
    <div className="chart" role="img" aria-label="Daily performance line chart">
      <svg viewBox={`0 0 ${width} ${height}`}>
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = height - padding - (tick / max) * (height - padding * 2);
          return (
            <g key={tick}>
              <line className="chart-grid-line" x1={padding} x2={width - padding} y1={y} y2={y} />
              <text className="chart-axis-label" x={8} y={y + 4}>
                {tick}
              </text>
            </g>
          );
        })}
        <polyline
          fill="none"
          stroke="var(--accent)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
        />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="6" fill="var(--surface-strong)" stroke="var(--accent)" strokeWidth="3" />
            <text className="chart-axis-label" x={point.x} y={height - 8} textAnchor="middle">
              {point.label.replace(" ", "\n")}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function BarChart({ values }: { values: { label: string; value: number; tone: "green" | "amber" | "red" }[] }) {
  const width = 420;
  const height = 240;
  const padding = 32;
  const max = Math.max(1, ...values.map((item) => item.value));
  const barWidth = (width - padding * 2) / values.length - 18;

  return (
    <div className="chart" role="img" aria-label="Weekly completed and missed days bar chart">
      <svg viewBox={`0 0 ${width} ${height}`}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((tick) => {
          if (tick > max && tick !== 7) {
            return null;
          }
          const y = height - padding - (tick / Math.max(7, max)) * (height - padding * 2);
          return <line key={tick} className="chart-grid-line" x1={padding} x2={width - padding} y1={y} y2={y} />;
        })}
        {values.map((item, index) => {
          const x = padding + index * ((width - padding * 2) / values.length) + 9;
          const barHeight = (item.value / Math.max(7, max)) * (height - padding * 2);
          const y = height - padding - barHeight;
          const color = item.tone === "green" ? "var(--green)" : item.tone === "amber" ? "var(--amber)" : "var(--red)";

          return (
            <g key={item.label}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="10" fill={color} opacity="0.86" />
              <text className="chart-value-label" x={x + barWidth / 2} y={Math.max(18, y - 8)} textAnchor="middle">
                {item.value}
              </text>
              <text className="chart-axis-label" x={x + barWidth / 2} y={height - 8} textAnchor="middle">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
