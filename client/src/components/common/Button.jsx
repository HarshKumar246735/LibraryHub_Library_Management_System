import './Button.css';

export default function Button({ variant = 'primary', loading = false, className = '', children, disabled, ...props }) {
  return (
    <button className={`btn btn--${variant} ${className}`.trim()} disabled={disabled || loading} {...props}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}
