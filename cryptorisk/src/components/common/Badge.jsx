import './Badge.css';

/**
 * @param {string} variant - 'success' | 'danger' | 'warning' | 'primary' | 'neutral'
 */
export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`badge badge--${variant} ${className}`}>{children}</span>
  );
}
