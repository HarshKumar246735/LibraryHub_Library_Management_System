import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, buildPagination } from '../utils/response.js';
import * as bookService from '../services/bookService.js';
import { bookQuerySchema } from '../validators/bookSchemas.js';

export const list = asyncHandler(async (req, res) => {
  const query = bookQuerySchema.parse(req.query);
  const { items, total } = await bookService.listBooks(query);
  sendSuccess(res, { message: 'Books retrieved successfully', data: items, pagination: buildPagination(query.page, query.limit, total) });
});

export const categories = asyncHandler(async (_req, res) =>
  sendSuccess(res, { message: 'Categories retrieved', data: await bookService.listCategories() }));

export const getOne = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Book retrieved', data: await bookService.getBook(req.params.id) }));

export const create = asyncHandler(async (req, res) =>
  sendSuccess(res, { status: 201, message: 'Book created', data: await bookService.createBook(req.body) }));

export const update = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Book updated', data: await bookService.updateBook(req.params.id, req.body) }));

export const remove = asyncHandler(async (req, res) => {
  const result = await bookService.removeBook(req.params.id);
  sendSuccess(res, { message: result.archived ? 'Book archived to preserve borrowing history' : 'Book deleted', data: result });
});
