import './RiskMeter.css';

/**
 * Circular SVG risk gauge
 * @param {number} score - 0 to 100
 */
export default function RiskMeter({ score = 0 }) {
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Only use 75% of circle (270 degrees)
  const arcLen = circumference * 0.75;
  const dashOffset = arcLen - (score / 100) * arcLen;

  const getRiskLevel = (s) => {
    if (s < 34) return { label: 'Low Risk', color: '#0f9d58', bg: '#e6f4ed' };
    if (s < 67) return { label: 'Medium Risk', color: '#d97706', bg: '#fef3c7' };
    return { label: 'High Risk', color: '#dc3545', bg: '#fde8ea' };
  };

  const { label, color, bg } = getRiskLevel(score);

  return (
    <div className="risk-meter">
      <div className="risk-meter__gauge">
        <svg
          width={radius * 2}
          height={radius * 2}
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          style={{ transform: 'rotate(135deg)' }}
        >
          {/* Track */}
          <circle
            cx={radius} cy={radius} r={normalizedRadius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={stroke}
            strokeDasharray={`${arcLen} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Value */}
          <circle
            cx={radius} cy={radius} r={normalizedRadius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${arcLen - dashOffset} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s ease' }}
          />
        </svg>

        <div className="risk-meter__center">
          <span className="risk-meter__score" style={{ color }}>{score}</span>
          <span className="risk-meter__max">/100</span>
        </div>
      </div>

      <div className="risk-meter__badge" style={{ background: bg, color }}>
        {label}
      </div>

      <div className="risk-meter__scale">
        <span style={{ color: '#0f9d58' }}>Low</span>
        <span style={{ color: '#d97706' }}>Med</span>
        <span style={{ color: '#dc3545' }}>High</span>
      </div>
    </div>
  );
}
