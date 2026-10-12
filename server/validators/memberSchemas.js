import { z } from 'zod';
import { ROLES } from '../models/User.js';

const text = (max) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));
const password = z.string().min(8).max(72).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/, 'Password needs upper, lower case and a number');

export const createMemberSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password,
  role: z.enum(Object.values(ROLES)),
  phone: text(20),
  studentId: text(40),
}).strict();

export const updateMemberSchema = z.object({ fullName: z.string().trim().min(2).max(100).optional(), phone: text(20), studentId: text(40) }).strict();
export const statusSchema = z.object({ status: z.enum(['active', 'inactive']) }).strict();
export const roleSchema = z.object({ role: z.enum(Object.values(ROLES)) }).strict();
export const profileSchema = z.object({ fullName: z.string().trim().min(2).max(100).optional(), phone: text(20) }).strict();

export const memberQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(Object.values(ROLES)).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
