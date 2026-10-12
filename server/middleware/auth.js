import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { COOKIE_NAME, verifyToken } from '../utils/token.js';

// Identity always comes from the verified token, never from request bodies or params.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new ApiError(401, 'Please log in to continue');
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please log in again');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Your session is no longer valid');
  if (user.status !== 'active') throw new ApiError(403, 'This account has been deactivated');
  req.user = user;
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

// CSRF defence for cookie auth: browsers cannot add a custom header cross-origin
// without a CORS preflight, which our origin allow-list rejects for other sites.
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const requireCsrfHeader = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get('X-Requested-With') !== 'LibraryHub') return next(new ApiError(403, 'Missing required request header'));
  next();
};
