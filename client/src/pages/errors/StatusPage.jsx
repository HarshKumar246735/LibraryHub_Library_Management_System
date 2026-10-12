import { Link } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import './StatusPage.css';

export default function StatusPage({ code, title, message }) {
  return (
    <main className="status-page">
      <Logo />
      <p className="status-page__code">{code}</p>
      <h1>{title}</h1>
      <p>{message}</p>
      <Link className="btn btn--primary" to="/">Back to home</Link>
    </main>
  );
}
