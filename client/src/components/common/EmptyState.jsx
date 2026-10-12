import './EmptyState.css';

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="empty-state">
      {Icon && <span className="empty-state__icon"><Icon size={28} /></span>}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
