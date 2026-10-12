import { BorrowRequest } from '../models/BorrowRequest.js';
import { BookIssue } from '../models/BookIssue.js';
import { ApiError } from '../utils/ApiError.js';
import { startOfUtcDay } from '../utils/dates.js';

const BOOK_FIELDS = 'title author isbn coverImageUrl category';
const STUDENT_FIELDS = 'fullName email studentId';

async function paginate(model, filter, { page, limit }, populate) {
  const [items, total] = await Promise.all([
    model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate(populate).lean(),
    model.countDocuments(filter),
  ]);
  return { items, total };
}

const requestPopulate = [{ path: 'book', select: BOOK_FIELDS }, { path: 'student', select: STUDENT_FIELDS }];
const issuePopulate = [{ path: 'book', select: BOOK_FIELDS }, { path: 'student', select: STUDENT_FIELDS }];

export function listRequests(query, studentId) {
  const filter = {};
  if (studentId || query.student) filter.student = studentId || query.student; // ownership comes from the authenticated user
  if (query.status) filter.status = query.status;
  return paginate(BorrowRequest, filter, query, requestPopulate);
}

export async function getRequest(id, user) {
  const request = await BorrowRequest.findById(id).populate(requestPopulate).lean();
  const ownerId = request?.student?._id?.toString();
  if (!request || (user.role === 'STUDENT' && ownerId !== user._id.toString())) throw new ApiError(404, 'Request not found');
  return request;
}

export function listIssues(query, studentId) {
  const filter = {};
  if (studentId || query.student) filter.student = studentId || query.student;
  if (query.overdue === 'true') Object.assign(filter, { status: 'issued', dueDate: { $lt: startOfUtcDay(new Date()) } });
  else if (query.status) filter.status = query.status;
  return paginate(BookIssue, filter, query, issuePopulate);
}

export async function getIssue(id, user) {
  const issue = await BookIssue.findById(id).populate(issuePopulate).lean();
  const ownerId = issue?.student?._id?.toString();
  if (!issue || (user.role === 'STUDENT' && ownerId !== user._id.toString())) throw new ApiError(404, 'Issue record not found');
  return issue;
}
