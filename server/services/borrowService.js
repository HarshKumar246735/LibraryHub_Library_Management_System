import { Book } from '../models/Book.js';
import { User, ROLES } from '../models/User.js';
import { BookIssue } from '../models/BookIssue.js';
import { BorrowRequest } from '../models/BorrowRequest.js';
import { Fine } from '../models/Fine.js';
import { ApiError } from '../utils/ApiError.js';
import { addDays, startOfUtcDay } from '../utils/dates.js';
import { calculateFine } from '../utils/fine.js';
import { getSettings } from './settingsService.js';
import { audit } from './auditService.js';
import { notify } from './notificationService.js';

/* ---------- eligibility (always evaluated on the server) ---------- */
export async function assertCanBorrow(studentId, bookId) {
  const student = await User.findById(studentId);
  if (!student || student.role !== ROLES.STUDENT) throw new ApiError(404, 'Student not found');
  if (student.status !== 'active') throw new ApiError(403, 'This account is deactivated and cannot borrow books');

  const settings = await getSettings();
  const today = startOfUtcDay(new Date());
  const [activeLoans, sameBook, overdue, unpaid] = await Promise.all([
    BookIssue.countDocuments({ student: studentId, status: 'issued' }),
    BookIssue.exists({ student: studentId, book: bookId, status: 'issued' }),
    settings.blockIfOverdue ? BookIssue.exists({ student: studentId, status: 'issued', dueDate: { $lt: today } }) : null,
    settings.blockIfUnpaidFines ? Fine.exists({ student: studentId, status: 'pending' }) : null,
  ]);
  if (sameBook) throw new ApiError(409, 'You already have this book on loan');
  if (activeLoans >= settings.maxBorrowedBooks) throw new ApiError(409, `Borrowing limit reached (${settings.maxBorrowedBooks} books)`);
  if (overdue) throw new ApiError(409, 'Return your overdue books before borrowing more');
  if (unpaid) throw new ApiError(409, 'Clear your outstanding fines before borrowing more');
}

/* ---------- core inventory step: atomic decrement + loan creation, with compensation ---------- */
async function issueCopy({ bookId, studentId, issuedBy, requestId }) {
  const settings = await getSettings();
  // Conditional atomic update: two concurrent callers cannot both take the last copy.
  const book = await Book.findOneAndUpdate(
    { _id: bookId, isArchived: false, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } }
  );
  if (!book) throw new ApiError(409, 'No copies of this book are currently available');

  const issueDate = new Date();
  try {
    return await BookIssue.create({
      book: bookId,
      student: studentId,
      issuedBy,
      issueDate,
      dueDate: addDays(startOfUtcDay(issueDate), settings.borrowDays),
      borrowRequest: requestId,
    });
  } catch (err) {
    await Book.updateOne({ _id: bookId }, { $inc: { availableCopies: 1 } }); // give the copy back
    throw err;
  }
}

/* ---------- borrow requests ---------- */
export async function createRequest(studentId, bookId) {
  const book = await Book.findOne({ _id: bookId, isArchived: false });
  if (!book) throw new ApiError(404, 'Book not found');
  if (book.availableCopies < 1) throw new ApiError(409, 'This book is currently unavailable');
  await assertCanBorrow(studentId, bookId);
  if (await BorrowRequest.exists({ book: bookId, student: studentId, status: 'pending' })) {
    throw new ApiError(409, 'You already have a pending request for this book');
  }
  const request = await BorrowRequest.create({ book: bookId, student: studentId });
  await audit(studentId, 'REQUEST_CREATED', 'BorrowRequest', request._id, { book: bookId });
  await notify(studentId, 'REQUEST_SUBMITTED', 'Request submitted', `Your request for "${book.title}" is waiting for review.`);
  return request;
}

export async function cancelRequest(requestId, student) {
  const request = await BorrowRequest.findOneAndUpdate(
    { _id: requestId, student: student._id, status: 'pending' },
    { status: 'cancelled' },
    { new: true }
  );
  if (!request) throw new ApiError(404, 'No pending request found to cancel');
  await audit(student, 'REQUEST_CANCELLED', 'BorrowRequest', request._id);
  return request;
}

async function claimPending(requestId, reviewer, status, extra = {}) {
  const claimed = await BorrowRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { status, reviewedBy: reviewer._id, reviewedAt: new Date(), ...extra },
    { new: true }
  );
  if (!claimed) {
    const exists = await BorrowRequest.exists({ _id: requestId });
    throw new ApiError(exists ? 409 : 404, exists ? 'This request has already been processed' : 'Request not found');
  }
  return claimed;
}

export async function rejectRequest(requestId, reviewer, reason) {
  const request = await claimPending(requestId, reviewer, 'rejected', { rejectionReason: reason });
  await audit(reviewer, 'REQUEST_REJECTED', 'BorrowRequest', request._id, { reason });
  await notify(request.student, 'REQUEST_REJECTED', 'Request rejected', reason ? `Your borrow request was rejected: ${reason}` : 'Your borrow request was rejected.');
  return request;
}

export async function approveRequest(requestId, reviewer) {
  // Step 1: atomically claim the request, so it can be approved only once even if clicked twice.
  const claimed = await claimPending(requestId, reviewer, 'fulfilled');
  let issue;
  try {
    await assertCanBorrow(claimed.student, claimed.book);
    issue = await issueCopy({ bookId: claimed.book, studentId: claimed.student, issuedBy: reviewer._id, requestId: claimed._id });
  } catch (err) {
    // Roll the claim back so the request can be retried or rejected.
    await BorrowRequest.updateOne({ _id: claimed._id }, { status: 'pending', $unset: { reviewedBy: 1, reviewedAt: 1 } });
    throw err;
  }
  claimed.issue = issue._id;
  await BorrowRequest.updateOne({ _id: claimed._id }, { issue: issue._id });
  await audit(reviewer, 'REQUEST_APPROVED', 'BorrowRequest', claimed._id, { issue: issue._id });
  await audit(reviewer, 'BOOK_ISSUED', 'BookIssue', issue._id, { book: claimed.book, student: claimed.student });
  const bk = await Book.findById(claimed.book).select('title').lean();
  await notify(claimed.student, 'REQUEST_APPROVED', 'Request approved', `"${bk?.title}" has been issued to you. Due ${issue.dueDate.toISOString().slice(0, 10)}.`);
  return { request: claimed, issue };
}

/* ---------- direct issue (walk-in) by staff ---------- */
export async function issueDirect({ studentId, bookId }, staff) {
  await assertCanBorrow(studentId, bookId);
  const issue = await issueCopy({ bookId, studentId, issuedBy: staff._id });
  await audit(staff, 'BOOK_ISSUED', 'BookIssue', issue._id, { book: bookId, student: studentId, direct: true });
  return issue;
}

/* ---------- return ---------- */
export async function returnIssue(issueId, staff) {
  const returnDate = new Date();
  // Atomic claim: only the first caller moves 'issued' -> 'returned', so inventory is restored once.
  const issue = await BookIssue.findOneAndUpdate({ _id: issueId, status: 'issued' }, { status: 'returned', returnDate }, { new: true });
  if (!issue) {
    const exists = await BookIssue.exists({ _id: issueId });
    throw new ApiError(exists ? 409 : 404, exists ? 'This book has already been returned' : 'Issue record not found');
  }

  const restored = await Book.findOneAndUpdate(
    { _id: issue.book, $expr: { $lt: ['$availableCopies', '$totalCopies'] } },
    { $inc: { availableCopies: 1 } }
  );
  if (!restored) {
    await BookIssue.updateOne({ _id: issue._id }, { status: 'issued', $unset: { returnDate: 1 } });
    throw new ApiError(500, 'Inventory inconsistency detected; the return was not recorded');
  }

  const settings = await getSettings();
  const { daysLate, chargeableDays, amount } = calculateFine({
    dueDate: issue.dueDate, returnDate, ratePerDay: settings.finePerDay, graceDays: settings.graceDays, maxFine: settings.maxFine,
  });
  let fine = null;
  if (amount > 0) {
    try {
      fine = await Fine.create({ issue: issue._id, student: issue.student, amount, daysLate, chargeableDays, ratePerDay: settings.finePerDay });
    } catch (err) {
      if (err.code !== 11000) throw err; // unique index on issue prevents duplicate fines
    }
  }
  await audit(staff, 'BOOK_RETURNED', 'BookIssue', issue._id, { fine: fine?._id, amount });
  if (fine) await notify(issue.student, 'FINE_RECORDED', 'Fine recorded', `A late-return fine of ₹${amount} was recorded (${chargeableDays} chargeable day(s)).`);
  return { issue, fine };
}
