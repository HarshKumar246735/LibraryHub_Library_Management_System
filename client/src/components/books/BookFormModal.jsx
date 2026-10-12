import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormField from '../common/FormField';
import { booksApi } from '../../services/bookService';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import { useToast } from '../common/Toast';
import './BookFormModal.css';

const EMPTY = { title: '', author: '', isbn: '', category: '', publisher: '', publicationYear: '', language: '', shelfLocation: '', totalCopies: '1', coverImageUrl: '', description: '' };

const toForm = (book) => Object.fromEntries(Object.keys(EMPTY).map((k) => [k, book?.[k] === undefined || book?.[k] === null ? '' : String(book[k])]));

export default function BookFormModal({ open, book, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const editing = Boolean(book);

  useEffect(() => { if (open) { setForm(book ? toForm(book) : EMPTY); setErrors({}); } }, [open, book]);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.author.trim()) next.author = 'Author is required';
    if (!form.category.trim()) next.category = 'Category is required';
    if (!/^\d+$/.test(form.totalCopies)) next.totalCopies = 'Enter a whole number, 0 or more';
    setErrors(next);
    if (Object.keys(next).length) return;

    // Empty optional fields are omitted so the server treats them as "not provided".
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '').map(([k, v]) => [k, v]));
    setSaving(true);
    try {
      const saved = editing ? await booksApi.update(book._id, payload) : await booksApi.create(payload);
      toast.success(editing ? 'Book updated.' : 'Book added.');
      onSaved(saved);
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, extra = {}) => <FormField id={`book-${name}`} name={name} label={label} value={form[name]} onChange={onChange} error={errors[name]} {...extra} />;

  return (
    <Modal open={open} title={editing ? 'Edit book' : 'Add a book'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" form="book-form" loading={saving}>{editing ? 'Save changes' : 'Add book'}</Button></>}>
      <form id="book-form" className="book-form" onSubmit={onSubmit} noValidate>
        {field('title', 'Title')}
        {field('author', 'Author')}
        <div className="book-form__row">{field('isbn', 'ISBN (optional)')}{field('category', 'Category')}</div>
        <div className="book-form__row">{field('publisher', 'Publisher')}{field('publicationYear', 'Publication year', { inputMode: 'numeric' })}</div>
        <div className="book-form__row">
          {field('totalCopies', 'Total copies', { inputMode: 'numeric', hint: editing ? `Currently ${book.totalCopies - book.availableCopies} on loan; the total cannot go below that.` : undefined })}
          {field('shelfLocation', 'Shelf location')}
        </div>
        {field('language', 'Language')}
        {field('coverImageUrl', 'Cover image URL', { type: 'url', placeholder: 'https://…' })}
        <div className="form-field">
          <label htmlFor="book-description">Description</label>
          <textarea id="book-description" name="description" rows={4} maxLength={3000} value={form.description} onChange={onChange} className="book-form__textarea" />
          {errors.description && <small className="form-field__error">{errors.description}</small>}
        </div>
      </form>
    </Modal>
  );
}
