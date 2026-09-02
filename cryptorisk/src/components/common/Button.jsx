import './Button.css';

/**
 * Button component
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
 * @param {string} size    - 'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size}${fullWidth ? ' btn--full' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
