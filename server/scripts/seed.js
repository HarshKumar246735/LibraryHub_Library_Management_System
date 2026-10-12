// Demo data for DEVELOPMENT ONLY.
//   npm run seed          adds demo books, demo users and a few loans
//   npm run seed:remove   removes exactly what the seed created
// Refuses to run in production unless ALLOW_SEED=true. It never drops collections.
import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { User, ROLES } from '../models/User.js';
import { Book } from '../models/Book.js';
import { BookIssue } from '../models/BookIssue.js';
import { BorrowRequest } from '../models/BorrowRequest.js';
import { Fine } from '../models/Fine.js';
import { PaymentRecord } from '../models/PaymentRecord.js';
import { RenewalRequest } from '../models/RenewalRequest.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { issueDirect, returnIssue } from '../services/borrowService.js';
import { notify } from '../services/notificationService.js';
import { DEMO_BOOKS, DEMO_DOMAIN } from './seedData.js';

if (env.isProduction && process.env.ALLOW_SEED !== 'true') {
  console.error('Refusing to seed while NODE_ENV=production. Set ALLOW_SEED=true only if you really mean it.');
  process.exit(1);
}

const remove = process.argv.includes('--remove');
const demoUsers = () => User.find({ email: new RegExp(`@${DEMO_DOMAIN.replace(/\./g, '\\.')}$`) }).select('_id');

async function removeDemo() {
  const ids = (await demoUsers()).map((u) => u._id);
  const isbns = DEMO_BOOKS.map((x) => x.isbn);
  const books = (await Book.find({ isbn: { $in: isbns } }).select('_id')).map((x) => x._id);
  await Promise.all([
    BookIssue.deleteMany({ $or: [{ student: { $in: ids } }, { book: { $in: books } }] }),
    BorrowRequest.deleteMany({ $or: [{ student: { $in: ids } }, { book: { $in: books } }] }),
    Fine.deleteMany({ student: { $in: ids } }),
    PaymentRecord.deleteMany({ student: { $in: ids } }),
    RenewalRequest.deleteMany({ student: { $in: ids } }),
    Notification.deleteMany({ recipient: { $in: ids } }),
    AuditLog.deleteMany({ actor: { $in: ids } }),
  ]);
  await Book.deleteMany({ isbn: { $in: isbns } });
  const { deletedCount } = await User.deleteMany({ _id: { $in: ids } });
  console.log(`Removed demo data (${deletedCount} demo users, ${isbns.length} demo books and related records).`);
}

async function addDemo() {
  // Generated per run and printed once; never reuse these outside local development.
  const password = process.env.SEED_PASSWORD || `${crypto.randomBytes(6).toString('hex')}Aa1`;
  // User.create runs the pre-save hook, so passwords are hashed.
  const ensure = async (name, key, role) => {
    const existing = await User.findOne({ email: `${key}@${DEMO_DOMAIN}` });
    if (existing) return existing;
    return User.create({ fullName: name, email: `${key}@${DEMO_DOMAIN}`, password, role, studentId: role === ROLES.STUDENT ? `DEMO-${key}` : undefined });
  };
  const librarian = await ensure('Demo Librarian', 'librarian', ROLES.LIBRARIAN);
  const students = [];
  for (const [i, n] of ['Aarav Sharma', 'Diya Patel', 'Rohan Iyer'].entries()) students.push(await ensure(n, `student${i + 1}`, ROLES.STUDENT));

  for (const book of DEMO_BOOKS) {
    await Book.updateOne({ isbn: book.isbn }, { $setOnInsert: { ...book, availableCopies: book.totalCopies } }, { upsert: true });
  }
  const books = await Book.find({ isbn: { $in: DEMO_BOOKS.map((x) => x.isbn) } });

  if (!(await BookIssue.exists({ student: { $in: students.map((s) => s._id) } }))) {
    await issueDirect({ studentId: students[0]._id, bookId: books[0]._id }, librarian);
    await issueDirect({ studentId: students[0]._id, bookId: books[5]._id }, librarian);
    const overdue = await issueDirect({ studentId: students[1]._id, bookId: books[11]._id }, librarian);
    const late = await issueDirect({ studentId: students[2]._id, bookId: books[17]._id }, librarian);
    await BookIssue.updateOne({ _id: overdue._id }, { dueDate: new Date(Date.now() - 4 * 864e5) }); // overdue loan
    await BookIssue.updateOne({ _id: late._id }, { dueDate: new Date(Date.now() - 3 * 864e5) });
    await returnIssue(late._id, librarian); // late return -> real fine from the real policy
    await BorrowRequest.create({ book: books[2]._id, student: students[1]._id });
    await notify(students[0]._id, 'WELCOME', 'Welcome to LibraryHub', 'Demo notification created by the seed script.');
  }
  console.log('Demo data ready (development only).');
  console.log(`  Librarian: librarian@${DEMO_DOMAIN}`);
  console.log(`  Students:  student1@${DEMO_DOMAIN}, student2@${DEMO_DOMAIN}, student3@${DEMO_DOMAIN}`);
  console.log(`  Password:  ${password}   (shown only for users created in this run)`);
  console.log('  Create your own admin with: npm run create-admin');
}

try {
  await connectDB(env.mongoUri);
  await (remove ? removeDemo() : addDemo());
} finally {
  await mongoose.disconnect();
}
