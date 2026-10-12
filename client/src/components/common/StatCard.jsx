import './StatCard.css';

export default function StatCard({ icon: Icon, label, value, tone = 'primary' }) {
  return (
    <div className="stat-card">
      <span className={`stat-card__icon stat-card__icon--${tone}`}><Icon size={20} /></span>
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
      </div>
    </div>
  );
}
