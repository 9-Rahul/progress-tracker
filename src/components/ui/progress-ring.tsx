type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: string | null;
  showText?: boolean;
  fontSize?: number;
  labelFontSize?: number;
};

export function ProgressRing({
  value = 0,
  size = 92,
  stroke,
  color = "#bbf43d",
  trackColor = "rgba(255, 255, 255, 0.08)",
  label = "SCORE",
  showText = true,
  fontSize,
  labelFontSize
}: ProgressRingProps) {
  const normalizedValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const normalizedSize = typeof size === 'number' && !isNaN(size) ? size : 92;
  const normalizedStroke = stroke ?? Math.max(3, Math.round(normalizedSize * 0.075));

  const normalized = Math.min(100, Math.max(0, normalizedValue));
  const radius = (normalizedSize - normalizedStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = isNaN(circumference) ? 0 : circumference - (normalized / 100) * circumference;

  // Proportional font sizing so text never overflows or clips the circle
  const hasLabel = Boolean(label);
  const valueFontSize = fontSize ?? Math.max(10, Math.round(normalizedSize * (hasLabel ? 0.22 : 0.28)));
  const labelFontSizeCalc = labelFontSize ?? Math.max(6, Math.round(normalizedSize * 0.085));
  const showInternalText = showText && normalizedSize >= 42;

  return (
    <div
      className="progress-ring"
      style={{
        width: normalizedSize,
        height: normalizedSize,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}
    >
      <svg
        width={normalizedSize}
        height={normalizedSize}
        viewBox={`0 0 ${normalizedSize} ${normalizedSize}`}
        aria-label={`${normalized}% complete`}
        style={{ overflow: "visible" }}
      >
        <circle
          cx={normalizedSize / 2}
          cy={normalizedSize / 2}
          r={radius || 0}
          fill="none"
          stroke={trackColor}
          strokeWidth={normalizedStroke}
        />
        <circle
          cx={normalizedSize / 2}
          cy={normalizedSize / 2}
          r={radius || 0}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth={normalizedStroke}
          strokeDasharray={circumference || 0}
          strokeDashoffset={offset || 0}
          transform={`rotate(-90 ${normalizedSize / 2} ${normalizedSize / 2})`}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
        {showInternalText && (
          <>
            <text
              x="50%"
              y="50%"
              dy={hasLabel ? `-${Math.round(normalizedSize * 0.02)}px` : "0.35em"}
              textAnchor="middle"
              className="progress-ring-value"
              style={{
                fontWeight: 800,
                fontSize: `${valueFontSize}px`,
                fill: "#ffffff",
                letterSpacing: "-0.02em",
                fontFamily: "var(--apple-font, -apple-system, sans-serif)"
              }}
            >
              {Math.round(normalizedValue)}%
            </text>
            {hasLabel && (
              <text
                x="50%"
                y="50%"
                dy={`${Math.round(normalizedSize * 0.17)}px`}
                textAnchor="middle"
                className="progress-ring-label"
                style={{
                  fontSize: `${labelFontSizeCalc}px`,
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                  fill: "#7e7e88",
                  fontFamily: "var(--apple-font, -apple-system, sans-serif)"
                }}
              >
                {label}
              </text>
            )}
          </>
        )}
      </svg>
    </div>
  );
}
