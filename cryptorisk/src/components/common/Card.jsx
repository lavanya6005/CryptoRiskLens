import './Card.css';

export default function Card({ children, className = '', padding = true, ...rest }) {
  return (
    <div className={`card${padding ? '' : ' card--no-pad'} ${className}`} {...rest}>
      {children}
    </div>
  );
}
