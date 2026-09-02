import './VolatilityChart.css';

/**
 * Horizontal bar chart for volatility by asset
 * @param {Array<{asset:string, volatility:number, color:string}>} data
 */
export default function VolatilityChart({ data = [], title = 'Asset Volatility (30d)' }) {
  const max = Math.max(...data.map((d) => d.volatility));

  return (
    <div className="vol-chart">
      <div className="vol-chart__title">{title}</div>
      <div className="vol-chart__bars">
        {data.map((d) => (
          <div key={d.asset} className="vol-chart__row">
            <span className="vol-chart__label">{d.asset}</span>
            <div className="vol-chart__bar-wrap">
              <div
                className="vol-chart__bar"
                style={{ width: `${(d.volatility / max) * 100}%`, background: d.color }}
              />
            </div>
            <span className="vol-chart__value">{d.volatility}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
