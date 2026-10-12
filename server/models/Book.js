import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    author: { type: String, required: true, trim: true, maxlength: 120 },
    isbn: { type: String, trim: true },
    category: { type: String, required: true, trim: true, maxlength: 60, index: true },
    publisher: { type: String, trim: true, maxlength: 120 },
    publicationYear: { type: Number, min: 1000, max: 3000 },
    description: { type: String, trim: true, maxlength: 3000 },
    coverImageUrl: { type: String, trim: true, maxlength: 500 },
    totalCopies: { type: Number, required: true, min: 0, validate: Number.isInteger },
    availableCopies: { type: Number, required: true, min: 0, validate: Number.isInteger },
    shelfLocation: { type: String, trim: true, maxlength: 40 },
    language: { type: String, trim: true, maxlength: 40 },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

bookSchema.index({ isbn: 1 }, { unique: true, partialFilterExpression: { isbn: { $type: 'string' } } });
bookSchema.index({ title: 'text', author: 'text', isbn: 'text', category: 'text' });

bookSchema.pre('validate', function checkInventory(next) {
  if (this.availableCopies > this.totalCopies) {
    this.invalidate('availableCopies', 'Available copies cannot exceed total copies');
  }
  next();
});

export const Book = mongoose.model('Book', bookSchema);
