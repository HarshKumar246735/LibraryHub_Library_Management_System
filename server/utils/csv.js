// Escapes quotes/commas/newlines and neutralises spreadsheet formula injection (=, +, -, @ at the start).
export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export const toCsv = (headers, rows) => [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
