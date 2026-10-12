import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { toCsv } from '../utils/csv.js';
import * as reports from '../services/reportService.js';

const rangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});
function parseRange(query) {
  const q = rangeSchema.parse(query);
  const fallback = reports.lastMonthsRange(6);
  const from = q.from || fallback.from;
  const to = q.to || fallback.to;
  if (from > to) throw Object.assign(new Error('"from" must be before "to"'), { statusCode: 400, isOperational: true, errors: [] });
  return { from, to, format: q.format };
}
const sendCsv = (res, name, { headers, rows }) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`);
  res.send(toCsv(headers, rows));
};

export const adminDashboard = asyncHandler(async (_req, res) => sendSuccess(res, { message: 'Admin dashboard', data: await reports.adminDashboard() }));
export const librarianDashboard = asyncHandler(async (_req, res) => sendSuccess(res, { message: 'Librarian dashboard', data: await reports.librarianDashboard() }));
export const studentDashboard = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Student dashboard', data: await reports.studentDashboard(req.user._id) }));

export const borrowing = asyncHandler(async (req, res) => {
  const { from, to, format } = parseRange(req.query);
  if (format === 'csv') return sendCsv(res, 'borrowing-report', await reports.exportRows('borrowing', from, to));
  sendSuccess(res, { message: 'Borrowing report', data: await reports.borrowingReport(from, to) });
});
export const fines = asyncHandler(async (req, res) => {
  const { from, to, format } = parseRange(req.query);
  if (format === 'csv') return sendCsv(res, 'fines-report', await reports.exportRows('fines', from, to));
  sendSuccess(res, { message: 'Fines report', data: await reports.finesReport(from, to) });
});
export const inventory = asyncHandler(async (_req, res) => sendSuccess(res, { message: 'Inventory report', data: await reports.inventoryReport() }));
export const categories = asyncHandler(async (_req, res) => sendSuccess(res, { message: 'Category report', data: await reports.categoriesReport() }));
export const publicStats = asyncHandler(async (_req, res) => sendSuccess(res, { message: 'Public statistics', data: await reports.publicStats() }));
