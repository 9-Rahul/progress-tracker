type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
};

export function ProgressRing({ value, size = 82, stroke = 8 }: ProgressRingProps) {
  const normalized = Math.min(100, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${normalized}% complete`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text className="progress-ring-value" x="50%" y="48%" dominantBaseline="middle" textAnchor="middle">
          {normalized}
        </text>
        <text className="progress-ring-label" x="50%" y="66%" dominantBaseline="middle" textAnchor="middle">
          PCT
        </text>
      </svg>
    </div>
  );
}
