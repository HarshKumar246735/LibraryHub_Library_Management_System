import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[0-9]/, 'Password needs a number');
const email = z.string().trim().toLowerCase().email('Enter a valid email address');

// .strict() rejects unknown keys such as "role", so privilege escalation attempts fail loudly.
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required').max(100),
    email,
    password,
    confirmPassword: z.string(),
    phone: z.string().trim().max(20).optional().or(z.literal('').transform(() => undefined)),
    studentId: z.string().trim().max(40).optional().or(z.literal('').transform(() => undefined)),
  })
  .strict()
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
  .transform(({ confirmPassword, ...rest }) => rest);

export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') }).strict();
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password }).strict();
export const forgotPasswordSchema = z.object({ email }).strict();
export const resetPasswordSchema = z.object({ token: z.string().min(20), newPassword: password }).strict();
