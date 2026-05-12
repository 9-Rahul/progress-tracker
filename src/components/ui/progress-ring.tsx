type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
};

export function ProgressRing({ value = 0, size = 82, stroke = 8 }: ProgressRingProps) {
  const normalizedValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const normalizedSize = typeof size === 'number' && !isNaN(size) ? size : 82;
  const normalizedStroke = typeof stroke === 'number' && !isNaN(stroke) ? stroke : 8;

  const normalized = Math.min(100, Math.max(0, normalizedValue));
  const radius = (normalizedSize - normalizedStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = isNaN(circumference) ? 0 : circumference - (normalized / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: normalizedSize, height: normalizedSize }}>
      <svg width={normalizedSize} height={normalizedSize} viewBox={`0 0 ${normalizedSize} ${normalizedSize}`} aria-label={`${normalized}% complete`}>
        <circle
          cx={normalizedSize / 2}
          cy={normalizedSize / 2}
          r={radius || 0}
          fill="none"
          stroke="var(--border)"
          strokeWidth={normalizedStroke}
        />
        <circle
          cx={normalizedSize / 2}
          cy={normalizedSize / 2}
          r={radius || 0}
          fill="none"
          stroke="var(--accent)"
          strokeLinecap="round"
          strokeWidth={normalizedStroke}
          strokeDasharray={circumference || 0}
          strokeDashoffset={offset || 0}
          transform={`rotate(-90 ${normalizedSize / 2} ${normalizedSize / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dy="-1px"
          textAnchor="middle"
          className="progress-ring-value"
          style={{ fontWeight: 900, fontSize: '18px' }}
        >
          {Math.round(normalizedValue)}%
        </text>
        <text
          x="50%"
          y="50%"
          dy="15px"
          textAnchor="middle"
          className="progress-ring-label"
          style={{ fontSize: '7px', letterSpacing: '0.1em', fontWeight: 800, fill: '#666' }}
        >
          SCORE
        </text>
      </svg>
    </div>
  );
}
