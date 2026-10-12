import { useState } from 'react';
import { profileApi } from '../../services/libraryService';
import { authApi } from '../../services/authService';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import PageHeader from '../../components/common/PageHeader';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import './ProfilePage.css';

const STRONG = (p) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);

function DetailsForm() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2) return setErrors({ fullName: 'Full name is required' });
    setErrors({});
    setSaving(true);
    try {
      setUser(await profileApi.update({ fullName: form.fullName, phone: form.phone }));
      toast.success('Profile updated.');
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel profile__panel" onSubmit={onSubmit} noValidate>
      <h2>Personal details</h2>
      <FormField id="email" label="Email" value={user.email} readOnly hint="Email cannot be changed here." />
      <FormField id="fullName" name="fullName" label="Full name" value={form.fullName} onChange={onChange} error={errors.fullName} />
      <FormField id="phone" name="phone" label="Phone" value={form.phone} onChange={onChange} error={errors.phone} />
      <Button type="submit" loading={saving}>Save changes</Button>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password';
    if (!STRONG(form.newPassword)) next.newPassword = 'Use 8+ characters with upper, lower case and a number';
    if (form.confirm !== form.newPassword) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed.');
      setForm(empty);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel profile__panel" onSubmit={onSubmit} noValidate>
      <h2>Change password</h2>
      <FormField id="currentPassword" name="currentPassword" type="password" label="Current password" autoComplete="current-password" value={form.currentPassword} onChange={onChange} error={errors.currentPassword} />
      <FormField id="newPassword" name="newPassword" type="password" label="New password" autoComplete="new-password" value={form.newPassword} onChange={onChange} error={errors.newPassword} />
      <FormField id="confirm" name="confirm" type="password" label="Confirm new password" autoComplete="new-password" value={form.confirm} onChange={onChange} error={errors.confirm} />
      <Button type="submit" loading={saving}>Update password</Button>
    </form>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="My Profile" subtitle={<>Signed in as <Badge tone="info">{user.role.toLowerCase()}</Badge></>} />
      <div className="profile__grid">
        <DetailsForm />
        <PasswordForm />
      </div>
    </>
  );
}
