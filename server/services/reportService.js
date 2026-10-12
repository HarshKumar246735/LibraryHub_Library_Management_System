import { Book } from '../models/Book.js';
import { User, ROLES } from '../models/User.js';
import { BookIssue } from '../models/BookIssue.js';
import { BorrowRequest } from '../models/BorrowRequest.js';
import { Fine } from '../models/Fine.js';
import { PaymentRecord } from '../models/PaymentRecord.js';
import { AuditLog } from '../models/AuditLog.js';
import { startOfUtcDay } from '../utils/dates.js';

const monthStart = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
export const lastMonthsRange = (n = 6) => {
  const now = new Date();
  return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1), 1)), to: now };
};
const sumOf = (rows) => rows[0]?.total || 0;

function monthKeys(from, to) {
  const keys = [];
  for (let d = monthStart(from); d <= to && keys.length < 36; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) keys.push(d.toISOString().slice(0, 7));
  return keys;
}
async function monthlyCounts(model, field, from, to, match = {}) {
  const rows = await model.aggregate([
    { $match: { [field]: { $gte: from, $lte: to }, ...match } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: `$${field}` } }, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

export async function monthlyActivity(from, to) {
  const [issued, returned] = await Promise.all([monthlyCounts(BookIssue, 'issueDate', from, to), monthlyCounts(BookIssue, 'returnDate', from, to)]);
  return monthKeys(from, to).map((month) => ({ month, issued: issued[month] || 0, returned: returned[month] || 0 }));
}

const mostBorrowed = (from, to, limit = 5) =>
  BookIssue.aggregate([
    { $match: { issueDate: { $gte: from, $lte: to } } },
    { $group: { _id: '$book', count: { $sum: 1 } } },
    { $sort: { count: -1 } }, { $limit: limit },
    { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } }, { $unwind: '$book' },
    { $project: { _id: 0, bookId: '$_id', title: '$book.title', author: '$book.author', count: 1 } },
  ]);

const overdueFilter = () => ({ status: 'issued', dueDate: { $lt: startOfUtcDay(new Date()) } });
const outstandingFines = async () => {
  const rows = await Fine.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  return sumOf(rows);
};
const copyTotals = async () => {
  const rows = await Book.aggregate([{ $match: { isArchived: false } }, { $group: { _id: null, books: { $sum: 1 }, totalCopies: { $sum: '$totalCopies' }, availableCopies: { $sum: '$availableCopies' } } }]);
  return rows[0] || { books: 0, totalCopies: 0, availableCopies: 0 };
};
const recentActivity = (limit = 10) => AuditLog.find().sort({ createdAt: -1 }).limit(limit).populate('actor', 'fullName role').lean();

/* ---------- dashboards ---------- */
export async function adminDashboard() {
  const { from, to } = lastMonthsRange(6);
  const [copies, students, librarians, issued, pending, overdue, fines, activity, categories, popular, requestStatus, recent] = await Promise.all([
    copyTotals(),
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.LIBRARIAN, status: 'active' }),
    BookIssue.countDocuments({ status: 'issued' }),
    BorrowRequest.countDocuments({ status: 'pending' }),
    BookIssue.countDocuments(overdueFilter()),
    outstandingFines(),
    monthlyActivity(from, to),
    Book.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $project: { _id: 0, category: '$_id', count: 1 } }]),
    mostBorrowed(from, to),
    BorrowRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $project: { _id: 0, status: '$_id', count: 1 } }]),
    recentActivity(),
  ]);
  return {
    summary: { totalBooks: copies.books, totalCopies: copies.totalCopies, availableCopies: copies.availableCopies, registeredStudents: students, activeLibrarians: librarians, issuedBooks: issued, pendingRequests: pending, overdueBooks: overdue, outstandingFines: fines },
    charts: { monthlyActivity: activity, booksByCategory: categories, mostBorrowed: popular, requestStatus },
    recentActivity: recent,
  };
}

export async function librarianDashboard() {
  const [copies, issued, pending, overdue, returnsToday, recent] = await Promise.all([
    copyTotals(),
    BookIssue.countDocuments({ status: 'issued' }),
    BorrowRequest.countDocuments({ status: 'pending' }),
    BookIssue.countDocuments(overdueFilter()),
    BookIssue.countDocuments({ returnDate: { $gte: startOfUtcDay(new Date()) } }),
    recentActivity(8),
  ]);
  return { summary: { availableCopies: copies.availableCopies, activeIssues: issued, pendingRequests: pending, overdueBooks: overdue, returnsToday }, recentActivity: recent };
}

export async function studentDashboard(studentId) {
  const populate = { path: 'book', select: 'title author coverImageUrl' };
  const [current, pending, overdue, fines, upcoming, recent] = await Promise.all([
    BookIssue.countDocuments({ student: studentId, status: 'issued' }),
    BorrowRequest.countDocuments({ student: studentId, status: 'pending' }),
    BookIssue.countDocuments({ student: studentId, ...overdueFilter() }),
    Fine.aggregate([{ $match: { student: studentId, status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    BookIssue.find({ student: studentId, status: 'issued' }).sort({ dueDate: 1 }).limit(5).populate(populate).lean(),
    BookIssue.find({ student: studentId }).sort({ issueDate: -1 }).limit(5).populate(populate).lean(),
  ]);
  return { summary: { currentlyBorrowed: current, pendingRequests: pending, overdueBooks: overdue, outstandingFines: sumOf(fines) }, upcomingDue: upcoming, recentlyBorrowed: recent };
}

/* ---------- reports ---------- */
export async function borrowingReport(from, to) {
  const [activity, popular, students, registrations, totals] = await Promise.all([
    monthlyActivity(from, to),
    mostBorrowed(from, to, 10),
    BookIssue.aggregate([
      { $match: { issueDate: { $gte: from, $lte: to } } },
      { $group: { _id: '$student', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } }, { $unwind: '$u' },
      { $project: { _id: 0, studentId: '$_id', fullName: '$u.fullName', email: '$u.email', count: 1 } },
    ]),
    monthlyCounts(User, 'createdAt', from, to, { role: ROLES.STUDENT }),
    Promise.all([BookIssue.countDocuments({ issueDate: { $gte: from, $lte: to } }), BookIssue.countDocuments({ returnDate: { $gte: from, $lte: to } })]),
  ]);
  return {
    range: { from, to },
    totals: { issued: totals[0], returned: totals[1] },
    monthlyActivity: activity,
    mostBorrowedBooks: popular,
    mostActiveStudents: students,
    registrationTrend: monthKeys(from, to).map((month) => ({ month, registrations: registrations[month] || 0 })),
  };
}

export async function inventoryReport() {
  const [copies, issued, overdue, byCategory, outOfStock] = await Promise.all([
    copyTotals(),
    BookIssue.countDocuments({ status: 'issued' }),
    BookIssue.countDocuments(overdueFilter()),
    Book.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$category', titles: { $sum: 1 }, totalCopies: { $sum: '$totalCopies' }, availableCopies: { $sum: '$availableCopies' } } }, { $sort: { titles: -1 } }, { $project: { _id: 0, category: '$_id', titles: 1, totalCopies: 1, availableCopies: 1 } }]),
    Book.find({ isArchived: false, availableCopies: 0 }).select('title author category').limit(20).lean(),
  ]);
  return { totals: { titles: copies.books, totalCopies: copies.totalCopies, availableCopies: copies.availableCopies, currentlyIssued: issued, overdue }, byCategory, outOfStock };
}

export async function finesReport(from, to) {
  const [outstanding, collected, waived, payments] = await Promise.all([
    Fine.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    PaymentRecord.aggregate([{ $match: { createdAt: { $gte: from, $lte: to } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Fine.aggregate([{ $match: { status: 'waived', waivedAt: { $gte: from, $lte: to } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    PaymentRecord.find({ createdAt: { $gte: from, $lte: to } }).sort({ createdAt: -1 }).limit(50).populate('student', 'fullName email').populate('recordedBy', 'fullName').lean(),
  ]);
  const pack = (r) => ({ total: r[0]?.total || 0, count: r[0]?.count || 0 });
  return { range: { from, to }, outstanding: pack(outstanding), collected: pack(collected), waived: pack(waived), payments };
}

export async function categoriesReport() {
  const [stock, borrows] = await Promise.all([
    Book.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$category', titles: { $sum: 1 } } }]),
    BookIssue.aggregate([
      { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'b' } }, { $unwind: '$b' },
      { $group: { _id: '$b.category', borrows: { $sum: 1 } } },
    ]),
  ]);
  const borrowMap = Object.fromEntries(borrows.map((b) => [b._id, b.borrows]));
  return stock.map((s) => ({ category: s._id, titles: s.titles, borrows: borrowMap[s._id] || 0 })).sort((a, b) => b.titles - a.titles);
}

export async function publicStats() {
  const [copies, categories, students, active] = await Promise.all([
    copyTotals(), Book.distinct('category', { isArchived: false }), User.countDocuments({ role: ROLES.STUDENT, status: 'active' }), BookIssue.countDocuments({ status: 'issued' }),
  ]);
  return { totalBooks: copies.books, totalCopies: copies.totalCopies, categories: categories.length, registeredStudents: students, loansInProgress: active };
}

export async function exportRows(kind, from, to) {
  if (kind === 'borrowing') {
    const issues = await BookIssue.find({ issueDate: { $gte: from, $lte: to } }).sort({ issueDate: -1 }).limit(5000).populate('book', 'title isbn').populate('student', 'fullName email').lean();
    return { headers: ['Student', 'Email', 'Book', 'ISBN', 'Issued', 'Due', 'Returned', 'Status'], rows: issues.map((i) => [i.student?.fullName, i.student?.email, i.book?.title, i.book?.isbn, i.issueDate, i.dueDate, i.returnDate, i.status]) };
  }
  const fines = await Fine.find({ createdAt: { $gte: from, $lte: to } }).sort({ createdAt: -1 }).limit(5000).populate('student', 'fullName email').lean();
  return { headers: ['Student', 'Email', 'Amount', 'Days late', 'Rate per day', 'Status', 'Created'], rows: fines.map((f) => [f.student?.fullName, f.student?.email, f.amount, f.daysLate, f.ratePerDay, f.status, f.createdAt]) };
}
