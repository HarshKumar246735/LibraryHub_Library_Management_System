import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export const validateObjectId = (param = 'id') => (req, _res, next) =>
  mongoose.isValidObjectId(req.params[param]) ? next() : next(new ApiError(400, 'Invalid identifier supplied'));
