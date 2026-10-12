import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import './LookupSelect.css';

// Type to search the server, pick one result. `search(text)` must resolve to an array.
export default function LookupSelect({ id, label, placeholder, search, getLabel, getHint, value, onChange }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(text, 350);
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    const term = debounced.trim();
    if (value || term.length < 2) { setResults([]); return undefined; }
    let cancelled = false;
    setLoading(true);
    searchRef.current(term)
      .then((r) => !cancelled && setResults(r))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [debounced, value]);

  return (
    <div className="lookup">
      <label htmlFor={id}>{label}</label>
      {value ? (
        <div className="lookup__chip">
          <span>{getLabel(value)}</span>
          <button type="button" aria-label={`Clear ${label}`} onClick={() => { onChange(null); setText(''); }}><X size={16} /></button>
        </div>
      ) : (
        <>
          <input id={id} type="search" autoComplete="off" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
          {text.trim().length >= 2 && (
            <ul className="lookup__results" role="listbox" aria-label={`${label} results`}>
              {loading && <li className="lookup__note">Searching…</li>}
              {!loading && results.length === 0 && <li className="lookup__note">No matches</li>}
              {results.map((r) => (
                <li key={r._id}>
                  <button type="button" role="option" aria-selected="false" onClick={() => onChange(r)}>
                    <strong>{getLabel(r)}</strong>
                    {getHint && <small>{getHint(r)}</small>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
