import './Skeleton.css';

export default function Skeleton({ height = 16, width = '100%', radius = 8 }) {
  return <span className="skeleton" style={{ height, width, borderRadius: radius }} aria-hidden="true" />;
}
