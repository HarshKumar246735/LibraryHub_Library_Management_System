import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

export function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message;
  let errors = err.errors || [];

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    errors = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier supplied';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = `A record with this ${field} already exists`;
  } else if (!err.isOperational) {
    status = 500;
    message = 'Something went wrong on our side';
    console.error(err);
  }

  const body = { success: false, message, errors };
  if (!env.isProduction && status === 500) body.stack = err.stack;
  res.status(status).json(body);
}
