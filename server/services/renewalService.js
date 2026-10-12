import { BookIssue } from '../models/BookIssue.js';
import { RenewalRequest } from '../models/RenewalRequest.js';
import { ApiError } from '../utils/ApiError.js';
import { MS_PER_DAY, startOfUtcDay } from '../utils/dates.js';
import { getSettings } from './settingsService.js';
import { audit } from './auditService.js';
import { notify } from './notificationService.js';

const populate = [{ path: 'student', select: 'fullName email' }, { path: 'issue', select: 'book dueDate renewalCount', populate: { path: 'book', select: 'title author' } }];

export async function createRenewal(issueId, student) {
  const settings = await getSettings();
  const issue = await BookIssue.findOne({ _id: issueId, student: student._id }); // ownership from the session
  if (!issue) throw new ApiError(404, 'Loan not found');
  if (issue.status !== 'issued') throw new ApiError(409, 'Only active loans can be renewed');
  if (issue.dueDate < startOfUtcDay(new Date())) throw new ApiError(409, 'Overdue books cannot be renewed. Please return the book');
  if (issue.renewalCount >= settings.maxRenewals) throw new ApiError(409, `Renewal limit reached (${settings.maxRenewals})`);
  if (await RenewalRequest.exists({ issue: issue._id, status: 'pending' })) throw new ApiError(409, 'A renewal request is already pending for this loan');
  const renewal = await RenewalRequest.create({ issue: issue._id, student: student._id });
  await audit(student, 'RENEWAL_REQUESTED', 'RenewalRequest', renewal._id);
  return renewal;
}

export async function listRenewals({ status, page, limit }, studentId) {
  const filter = {};
  if (studentId) filter.student = studentId;
  if (status) filter.status = status;
  const [items, total] = await Promise.all([
    RenewalRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate(populate).lean(),
    RenewalRequest.countDocuments(filter),
  ]);
  return { items, total };
}

async function claim(id, reviewer, status, extra = {}) {
  const r = await RenewalRequest.findOneAndUpdate({ _id: id, status: 'pending' }, { status, reviewedBy: reviewer._id, reviewedAt: new Date(), ...extra }, { new: true });
  if (!r) {
    const exists = await RenewalRequest.exists({ _id: id });
    throw new ApiError(exists ? 409 : 404, exists ? 'This renewal has already been processed' : 'Renewal request not found');
  }
  return r;
}

export async function rejectRenewal(id, reviewer, reason) {
  const r = await claim(id, reviewer, 'rejected', { rejectionReason: reason });
  await audit(reviewer, 'RENEWAL_REJECTED', 'RenewalRequest', r._id, { reason });
  await notify(r.student, 'RENEWAL_REJECTED', 'Renewal rejected', reason ? `Your renewal was rejected: ${reason}` : 'Your renewal request was rejected.');
  return r;
}

export async function approveRenewal(id, reviewer) {
  const settings = await getSettings();
  const renewal = await claim(id, reviewer, 'approved');
  const extensionMs = settings.borrowDays * MS_PER_DAY;
  // One atomic, conditional update: still active, not overdue, under the limit. Extends from the current due date.
  const issue = await BookIssue.findOneAndUpdate(
    { _id: renewal.issue, status: 'issued', dueDate: { $gte: startOfUtcDay(new Date()) }, renewalCount: { $lt: settings.maxRenewals } },
    [{ $set: { dueDate: { $add: ['$dueDate', extensionMs] }, renewalCount: { $add: ['$renewalCount', 1] } } }],
    { new: true }
  );
  if (!issue) {
    await RenewalRequest.updateOne({ _id: renewal._id }, { status: 'pending', $unset: { reviewedBy: 1, reviewedAt: 1 } });
    throw new ApiError(409, 'This loan can no longer be renewed (returned, overdue, or renewal limit reached)');
  }
  const newDueDate = issue.dueDate;
  await RenewalRequest.updateOne({ _id: renewal._id }, { newDueDate, previousDueDate: new Date(newDueDate.getTime() - extensionMs) });
  await audit(reviewer, 'RENEWAL_APPROVED', 'RenewalRequest', renewal._id, { newDueDate });
  await notify(renewal.student, 'RENEWAL_APPROVED', 'Renewal approved', `Your new due date is ${newDueDate.toISOString().slice(0, 10)}.`);
  return { renewal: await RenewalRequest.findById(renewal._id), issue };
}
