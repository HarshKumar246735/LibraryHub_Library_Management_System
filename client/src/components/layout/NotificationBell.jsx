import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationsApi } from '../../services/libraryService';
import { useAsync } from '../../hooks/useAsync';
import { formatDateTime } from '../../utils/format';
import './NotificationBell.css';

const POLL_MS = 60000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data, reload } = useAsync(() => notificationsApi.list({ limit: 5 }), []);

  useEffect(() => {
    const id = setInterval(reload, POLL_MS);
    return () => clearInterval(id);
  }, [reload]);

  useEffect(() => {
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const unread = data?.unreadCount || 0;
  const markAll = async () => { await notificationsApi.readAll(); reload(); };

  return (
    <div className="bell" ref={ref}>
      <button type="button" className="bell__btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Bell size={20} />
        {unread > 0 && <span className="bell__badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="bell__panel">
          <div className="bell__head">
            <strong>Notifications</strong>
            {unread > 0 && <button type="button" onClick={markAll}>Mark all read</button>}
          </div>
          {data?.items.length ? (
            <ul>
              {data.items.map((n) => (
                <li key={n._id} className={n.isRead ? '' : 'is-unread'}>
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                  <small>{formatDateTime(n.createdAt)}</small>
                </li>
              ))}
            </ul>
          ) : <p className="bell__empty">You are all caught up.</p>}
          <Link to="/notifications" onClick={() => setOpen(false)} className="bell__all">View all</Link>
        </div>
      )}
    </div>
  );
}
