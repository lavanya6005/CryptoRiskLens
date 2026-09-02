import './PieChart.css';

/**
 * Pure SVG pie chart
 * @param {Array<{name:string, value:number, color:string}>} data
 */
export default function PieChart({ data = [], title = 'Asset Allocation' }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = 90, cy = 90, r = 70, innerR = 42;

  let cumAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const xi1 = cx + innerR * Math.cos(cumAngle - angle);
    const yi1 = cy + innerR * Math.sin(cumAngle - angle);
    const xi2 = cx + innerR * Math.cos(cumAngle);
    const yi2 = cy + innerR * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return {
      ...d,
      d: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${innerR},${innerR} 0 ${large},0 ${xi1},${yi1} Z`,
      pct: ((d.value / total) * 100).toFixed(1),
    };
  });

  return (
    <div className="pie-chart">
      <div className="pie-chart__title">{title}</div>
      <div className="pie-chart__body">
        <svg viewBox="0 0 180 180" className="pie-chart__svg" aria-label={title} role="img">
          {slices.map((s, i) => (
            <path key={i} d={s.d} fill={s.color} stroke="#fff" strokeWidth="2">
              <title>{s.name}: {s.pct}%</title>
            </path>
          ))}
        </svg>
        <div className="pie-chart__legend">
          {slices.map((s, i) => (
            <div key={i} className="pie-chart__legend-item">
              <span className="pie-chart__dot" style={{ background: s.color }} />
              <span className="pie-chart__legend-name">{s.name}</span>
              <span className="pie-chart__legend-pct">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
