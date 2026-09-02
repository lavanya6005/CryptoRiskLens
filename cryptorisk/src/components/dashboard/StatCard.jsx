import './StatCard.css';

/**
 * @param {string} title
 * @param {string} value
 * @param {string} change  - e.g. "+12.4%"
 * @param {boolean} positive
 * @param {string} subtitle
 * @param {ReactNode} icon
 */
export default function StatCard({ title, value, change, positive, subtitle, icon, accent }) {
  return (
    <div className={`stat-card${accent ? ` stat-card--${accent}` : ''}`}>
      <div className="stat-card__header">
        <span className="stat-card__title">{title}</span>
        {icon && <span className="stat-card__icon">{icon}</span>}
      </div>
      <div className="stat-card__value">{value}</div>
      {change && (
        <div className={`stat-card__change${positive ? ' positive' : ' negative'}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {positive
              ? <polyline points="18 15 12 9 6 15" />
              : <polyline points="6 9 12 15 18 9" />}
          </svg>
          <span>{change}</span>
        </div>
      )}
      {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
    </div>
  );
}
