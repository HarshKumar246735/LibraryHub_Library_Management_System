import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, buildPagination } from '../utils/response.js';
import * as borrow from '../services/borrowService.js';
import * as queries from '../services/queryService.js';
import { listQuerySchema } from '../validators/borrowSchemas.js';

const paged = (res, message, { items, total }, query) =>
  sendSuccess(res, { message, data: items, pagination: buildPagination(query.page, query.limit, total) });

/* requests */
export const createRequest = asyncHandler(async (req, res) =>
  sendSuccess(res, { status: 201, message: 'Borrow request submitted', data: await borrow.createRequest(req.user._id, req.body.bookId) }));

export const myRequests = asyncHandler(async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  paged(res, 'Your requests', await queries.listRequests(q, req.user._id), q);
});

export const allRequests = asyncHandler(async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  paged(res, 'Requests retrieved', await queries.listRequests(q), q);
});

export const getRequest = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Request retrieved', data: await queries.getRequest(req.params.id, req.user) }));

export const approveRequest = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Request approved and book issued', data: await borrow.approveRequest(req.params.id, req.user) }));

export const rejectRequest = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Request rejected', data: await borrow.rejectRequest(req.params.id, req.user, req.body.reason) }));

export const cancelRequest = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Request cancelled', data: await borrow.cancelRequest(req.params.id, req.user) }));

/* issues */
export const myIssues = asyncHandler(async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  paged(res, 'Your loans', await queries.listIssues(q, req.user._id), q);
});

export const allIssues = asyncHandler(async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  paged(res, 'Loans retrieved', await queries.listIssues(q), q);
});

export const getIssue = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Loan retrieved', data: await queries.getIssue(req.params.id, req.user) }));

export const issueBook = asyncHandler(async (req, res) =>
  sendSuccess(res, { status: 201, message: 'Book issued', data: await borrow.issueDirect(req.body, req.user) }));

export const returnBook = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Book returned', data: await borrow.returnIssue(req.params.id, req.user) }));
