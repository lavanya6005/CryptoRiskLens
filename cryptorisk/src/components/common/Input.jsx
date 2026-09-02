import './Input.css';

export default function Input({
  label,
  id,
  type = 'text',
  error,
  hint,
  className = '',
  ...rest
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <input
        id={id}
        type={type}
        className={`form-input${error ? ' form-input--error' : ''}`}
        {...rest}
      />
      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  );
}

export function Select({ label, id, error, children, className = '', ...rest }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <select
        id={id}
        className={`form-select${error ? ' form-input--error' : ''}`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
