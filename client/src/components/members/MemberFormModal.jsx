import './MemberModals.css';
import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormField from '../common/FormField';
import { membersApi } from '../../services/staffService';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import { useToast } from '../common/Toast';

const EMPTY = { fullName: '', email: '', password: '', role: 'LIBRARIAN', phone: '', studentId: '' };

// Admin-only: creates staff (or student) accounts. Public registration can only create students.
export default function MemberFormModal({ open, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setForm(EMPTY); setErrors({}); } }, [open]);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    const p = form.password;
    if (p.length < 8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) next.password = 'Use 8+ characters with upper, lower case and a number';
    setErrors(next);
    if (Object.keys(next).length) return;
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    setSaving(true);
    try {
      await membersApi.create(payload);
      toast.success('Member created. Share the temporary password securely.');
      onSaved();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Add a member" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" form="member-form" loading={saving}>Create account</Button></>}>
      <form id="member-form" onSubmit={onSubmit} noValidate>
        <FormField id="m-name" name="fullName" label="Full name" value={form.fullName} onChange={onChange} error={errors.fullName} />
        <FormField id="m-email" name="email" type="email" label="Email" value={form.email} onChange={onChange} error={errors.email} />
        <FormField id="m-password" name="password" type="password" label="Temporary password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} />
        <div className="form-field">
          <label htmlFor="m-role">Role</label>
          <select id="m-role" name="role" value={form.role} onChange={onChange} className="member-select">
            <option value="LIBRARIAN">Librarian</option>
            <option value="ADMIN">Administrator</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>
        <FormField id="m-phone" name="phone" label="Phone (optional)" value={form.phone} onChange={onChange} error={errors.phone} />
      </form>
    </Modal>
  );
}
