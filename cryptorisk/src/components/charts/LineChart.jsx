import './LineChart.css';

/**
 * Pure SVG line chart — no external library
 * @param {Array<{date: string, value: number}>} data
 */
export default function LineChart({ data = [], title = 'Portfolio Performance', color = '#1C6B4A' }) {
  if (!data.length) return null;

  const W = 600, H = 200;
  const padL = 40, padR = 10, padT = 10, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const values = data.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const xStep = chartW / (data.length - 1);
  const toX = (i) => padL + i * xStep;
  const toY = (v) => padT + chartH - ((v - minV) / range) * chartH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');
  const fillPoints = `${padL},${padT + chartH} ${points} ${toX(data.length - 1)},${padT + chartH}`;

  // Y-axis labels (3 ticks)
  const yTicks = [minV, (minV + maxV) / 2, maxV].map((v) => ({ value: v.toFixed(0), y: toY(v) }));
  // X-axis: show every 6th label
  const xLabels = data.filter((_, i) => i % 6 === 0 || i === data.length - 1);

  const isPositive = values[values.length - 1] >= values[0];

  return (
    <div className="line-chart">
      <div className="line-chart__header">
        <span className="line-chart__title">{title}</span>
        <span className={`line-chart__change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(((values[values.length - 1] - values[0]) / values[0]) * 100).toFixed(2)}% (30d)
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="line-chart__svg"
        aria-label={title}
        role="img"
      >
        {/* Grid lines */}
        {yTicks.map((t) => (
          <line
            key={t.value}
            x1={padL} y1={t.y} x2={W - padR} y2={t.y}
            stroke="#E5E5E5" strokeWidth="1" strokeDasharray="4,4"
          />
        ))}

        {/* Fill */}
        <polygon
          points={fillPoints}
          fill={color}
          fillOpacity="0.06"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Y labels */}
        {yTicks.map((t) => (
          <text key={t.value} x={padL - 4} y={t.y + 4} textAnchor="end"
            fontSize="10" fill="#9ca3af">{t.value}</text>
        ))}

        {/* X labels */}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d);
          return (
            <text key={i} x={toX(idx)} y={H - 6} textAnchor="middle"
              fontSize="10" fill="#9ca3af">{d.date}</text>
          );
        })}
      </svg>
    </div>
  );
}
