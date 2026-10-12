import { z } from 'zod';

const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));
const intField = z.coerce.number().int();

export const bookBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    author: z.string().trim().min(1, 'Author is required').max(120),
    isbn: optionalText(20),
    category: z.string().trim().min(1, 'Category is required').max(60),
    publisher: optionalText(120),
    publicationYear: z.coerce.number().int().min(1000).max(new Date().getFullYear() + 1).optional().or(z.literal('').transform(() => undefined)),
    description: optionalText(3000),
    coverImageUrl: z.string().trim().url('Cover must be a valid URL').max(500).optional().or(z.literal('').transform(() => undefined)),
    totalCopies: intField.min(0, 'Total copies cannot be negative'),
    shelfLocation: optionalText(40),
    language: optionalText(40),
  })
  .strict();

// Updates may change totalCopies; availableCopies is derived server-side, never accepted from clients.
export const bookUpdateSchema = bookBodySchema.partial();

export const bookQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  author: z.string().trim().max(120).optional(),
  availability: z.enum(['available', 'unavailable']).optional(),
  year: z.coerce.number().int().optional(),
  sort: z.enum(['newest', 'title', '-title', 'year', '-year']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
