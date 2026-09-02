import './RiskPanel.css';

const factorColor = { low: 'var(--color-success)', medium: 'var(--color-warning)', high: 'var(--color-danger)' };
const factorBg   = { low: 'var(--color-success-light)', medium: 'var(--color-warning-light)', high: 'var(--color-danger-light)' };

export default function RiskPanel({ factors, recommendation }) {
  return (
    <div className="risk-panel">
      {factors.map((f) => (
        <div key={f.label} className="risk-panel__factor">
          <div className="risk-panel__factor-header">
            <span className="risk-panel__factor-label">{f.label}</span>
            <span
              className="risk-panel__factor-badge"
              style={{ color: factorColor[f.status], background: factorBg[f.status] }}
            >
              {f.value}/100
            </span>
          </div>
          <div className="risk-panel__bar">
            <div
              className="risk-panel__bar-fill"
              style={{ width: `${f.value}%`, background: factorColor[f.status] }}
            />
          </div>
          <p className="risk-panel__factor-desc">{f.description}</p>
        </div>
      ))}

      {recommendation && (
        <div className="risk-panel__recommendation">
          <div className="risk-panel__rec-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Risk Assessment</span>
          </div>
          <p className="risk-panel__rec-text">{recommendation}</p>
        </div>
      )}
    </div>
  );
}
