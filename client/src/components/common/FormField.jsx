import './FormField.css';

export default function FormField({ label, id, error, hint, ...inputProps }) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...inputProps} />
      {hint && !error && <small className="form-field__hint">{hint}</small>}
      {error && <small id={`${id}-error`} className="form-field__error">{error}</small>}
    </div>
  );
}
