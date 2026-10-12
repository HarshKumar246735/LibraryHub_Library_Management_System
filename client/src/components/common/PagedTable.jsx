import './PagedTable.css';
import { useEffect, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import DataTable from './DataTable';
import Pagination from './Pagination';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

// Server-paginated table with loading, error and empty states. Bump `refreshKey` to reload after an action.
export default function PagedTable({ load, params = {}, columns, emptyIcon, emptyTitle, emptyMessage, refreshKey = 0, pageSize = 10 }) {
  const [page, setPage] = useState(1);
  const paramsKey = JSON.stringify(params);
  useEffect(() => setPage(1), [paramsKey]);

  const { data, loading, error, reload } = useAsync(() => load({ ...params, page, limit: pageSize }), [paramsKey, page, refreshKey]);

  if (loading && !data) return <div className="paged-skeleton">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={52} radius={10} />)}</div>;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data || data.items.length === 0) return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  return (
    <>
      <DataTable columns={columns} rows={data.items} />
      <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
    </>
  );
}
