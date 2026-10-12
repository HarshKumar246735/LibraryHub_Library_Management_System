import './DataTable.css';

// columns: [{ header, render: (row) => node, className? }]. Becomes stacked cards on phones (see CSS).
export default function DataTable({ columns, rows, rowKey = (r) => r._id }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.header} className={c.className}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => <td key={c.header} data-label={c.header} className={c.className}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
