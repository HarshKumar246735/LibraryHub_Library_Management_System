import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, buildPagination } from '../utils/response.js';
import * as fines from '../services/fineService.js';
import * as renewals from '../services/renewalService.js';
import { listQuerySchema } from '../validators/borrowSchemas.js';

const paged = (res, message, { items, total }, q) => sendSuccess(res, { message, data: items, pagination: buildPagination(q.page, q.limit, total) });

export const myFines = asyncHandler(async (req, res) => { const q = listQuerySchema.parse(req.query); paged(res, 'Your fines', await fines.listFines(q, req.user._id), q); });
export const allFines = asyncHandler(async (req, res) => { const q = listQuerySchema.parse(req.query); paged(res, 'Fines retrieved', await fines.listFines(q), q); });
export const getFine = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Fine retrieved', data: await fines.getFine(req.params.id, req.user) }));
export const pay = asyncHandler(async (req, res) => sendSuccess(res, { status: 201, message: 'Payment recorded', data: await fines.recordPayment(req.params.id, req.body, req.user) }));
export const waive = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Fine waived', data: await fines.waiveFine(req.params.id, req.body.reason, req.user) }));

export const createRenewal = asyncHandler(async (req, res) => sendSuccess(res, { status: 201, message: 'Renewal requested', data: await renewals.createRenewal(req.body.issueId, req.user) }));
export const myRenewals = asyncHandler(async (req, res) => { const q = listQuerySchema.parse(req.query); paged(res, 'Your renewals', await renewals.listRenewals(q, req.user._id), q); });
export const allRenewals = asyncHandler(async (req, res) => { const q = listQuerySchema.parse(req.query); paged(res, 'Renewals retrieved', await renewals.listRenewals(q), q); });
export const approveRenewal = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Renewal approved', data: await renewals.approveRenewal(req.params.id, req.user) }));
export const rejectRenewal = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Renewal rejected', data: await renewals.rejectRenewal(req.params.id, req.user, req.body.reason) }));
