import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createRequestSchema = z.object({ bookId: objectId }).strict();
export const rejectRequestSchema = z.object({ reason: z.string().trim().max(300).optional() }).strict();
export const issueBookSchema = z.object({ studentId: objectId, bookId: objectId }).strict();

export const listQuerySchema = z.object({
  status: z.string().trim().max(20).optional(),
  overdue: z.enum(['true', 'false']).optional(),
  student: objectId.optional(), // honoured on staff-only list endpoints
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const recordPaymentSchema = z
  .object({ method: z.enum(['cash', 'upi', 'card', 'other']), reference: z.string().trim().max(80).optional() })
  .strict(); // no "amount": the server uses the stored fine

export const waiveSchema = z.object({ reason: z.string().trim().min(3, 'A reason is required').max(300) }).strict();
export const createRenewalSchema = z.object({ issueId: objectId }).strict();
