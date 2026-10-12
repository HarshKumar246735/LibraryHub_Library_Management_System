import { LibrarySettings } from '../models/LibrarySettings.js';
import { env } from '../config/env.js';

const defaults = () => ({
  key: 'default',
  finePerDay: env.finePerDay,
  borrowDays: env.defaultBorrowDays,
  maxBorrowedBooks: env.maxBorrowedBooks,
});

export async function getSettings() {
  try {
    return await LibrarySettings.findOneAndUpdate({ key: 'default' }, { $setOnInsert: defaults() }, { upsert: true, new: true, setDefaultsOnInsert: true });
  } catch (err) {
    if (err.code === 11000) return LibrarySettings.findOne({ key: 'default' }); // lost an upsert race
    throw err;
  }
}
