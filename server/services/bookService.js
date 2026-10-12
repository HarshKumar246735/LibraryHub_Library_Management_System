import { Book } from '../models/Book.js';
import { BookIssue } from '../models/BookIssue.js';
import { ApiError } from '../utils/ApiError.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTS = { newest: { createdAt: -1 }, title: { title: 1 }, '-title': { title: -1 }, year: { publicationYear: 1 }, '-year': { publicationYear: -1 } };

export async function listBooks(query) {
  const filter = { isArchived: false };
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i'); // escaped: user input is never used as a raw pattern
    filter.$or = [{ title: rx }, { author: rx }, { isbn: rx }, { category: rx }];
  }
  if (query.category) filter.category = new RegExp(`^${escapeRegex(query.category)}$`, 'i');
  if (query.author) filter.author = new RegExp(escapeRegex(query.author), 'i');
  if (query.year) filter.publicationYear = query.year;
  if (query.availability === 'available') filter.availableCopies = { $gt: 0 };
  if (query.availability === 'unavailable') filter.availableCopies = 0;

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Book.find(filter).sort(SORTS[query.sort]).skip(skip).limit(query.limit).lean(),
    Book.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getBook(id) {
  const book = await Book.findOne({ _id: id, isArchived: false });
  if (!book) throw new ApiError(404, 'Book not found');
  return book;
}

export const createBook = (data) => Book.create({ ...data, availableCopies: data.totalCopies });

export async function updateBook(id, data) {
  const book = await getBook(id);
  if (data.totalCopies !== undefined) {
    // Copies currently on loan = total - available. New total can never drop below that.
    const onLoan = book.totalCopies - book.availableCopies;
    if (data.totalCopies < onLoan) {
      throw new ApiError(409, `Cannot set total copies below ${onLoan}, the number currently on loan`);
    }
    book.availableCopies = data.totalCopies - onLoan;
  }
  Object.assign(book, data);
  await book.save();
  return book;
}

// Never destroys borrowing history: books with any history are archived, active loans block removal.
export async function removeBook(id) {
  const book = await getBook(id);
  const activeLoans = await BookIssue.countDocuments({ book: book._id, status: 'issued' });
  if (activeLoans > 0) throw new ApiError(409, 'This book has active loans and cannot be removed until they are returned');
  const hasHistory = await BookIssue.exists({ book: book._id });
  if (hasHistory) {
    book.isArchived = true;
    await book.save();
    return { archived: true };
  }
  await book.deleteOne();
  return { archived: false };
}

export const listCategories = () => Book.distinct('category', { isArchived: false }).then((c) => c.sort());
