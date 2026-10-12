import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, buildPagination } from '../utils/response.js';
import * as svc from '../services/notificationService.js';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  unreadOnly: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
});

export const list = asyncHandler(async (req, res) => {
  const q = querySchema.parse(req.query);
  const { items, total, unreadCount } = await svc.listNotifications(req.user._id, q);
  res.json({ success: true, message: 'Notifications retrieved', data: items, unreadCount, pagination: buildPagination(q.page, q.limit, total) });
});
export const read = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Marked as read', data: await svc.markRead(req.params.id, req.user._id) }));
export const readAll = asyncHandler(async (req, res) => { await svc.markAllRead(req.user._id); sendSuccess(res, { message: 'All notifications marked as read' }); });
