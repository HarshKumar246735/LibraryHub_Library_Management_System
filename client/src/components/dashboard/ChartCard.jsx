import { BarChart3 } from 'lucide-react';
import './ChartCard.css';

// Wraps a chart with a title and a friendly empty state when there is nothing to plot.
export default function ChartCard({ title, isEmpty, children }) {
  return (
    <section className="chart-card">
      <h2>{title}</h2>
      {isEmpty ? (
        <div className="chart-card__empty"><BarChart3 size={24} /><p>No data yet</p></div>
      ) : (
        <div className="chart-card__body">{children}</div>
      )}
    </section>
  );
}
