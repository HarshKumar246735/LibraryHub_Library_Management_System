import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, buildPagination } from '../utils/response.js';
import * as svc from '../services/memberService.js';
import { memberQuerySchema } from '../validators/memberSchemas.js';

export const list = asyncHandler(async (req, res) => {
  const q = memberQuerySchema.parse(req.query);
  const { items, total } = await svc.listMembers(q, req.user);
  sendSuccess(res, { message: 'Members retrieved', data: items, pagination: buildPagination(q.page, q.limit, total) });
});
export const getOne = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Member retrieved', data: await svc.getMember(req.params.id, req.user) }));
export const create = asyncHandler(async (req, res) => sendSuccess(res, { status: 201, message: 'Member created', data: await svc.createMember(req.body, req.user) }));
export const update = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Member updated', data: await svc.updateMember(req.params.id, req.body, req.user) }));
export const status = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Member status updated', data: await svc.setStatus(req.params.id, req.body.status, req.user) }));
export const role = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Member role updated', data: await svc.setRole(req.params.id, req.body.role, req.user) }));
