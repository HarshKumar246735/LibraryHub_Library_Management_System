import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const env = {
  port: toNumber(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: process.env.CLIENT_URL.split(',').map((u) => u.trim()).filter(Boolean),
  enableJobs: process.env.ENABLE_JOBS === 'true',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  // Defaults only; the live values are stored in LibrarySettings.
  finePerDay: toNumber(process.env.FINE_PER_DAY, 5),
  defaultBorrowDays: toNumber(process.env.DEFAULT_BORROW_DAYS, 7),
  maxBorrowedBooks: toNumber(process.env.MAX_BORROWED_BOOKS, 5),
};
