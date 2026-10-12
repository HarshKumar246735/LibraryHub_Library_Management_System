import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import { homeForRole } from '../../utils/roles';

const EMPTY = { fullName: '', email: '', password: '', confirmPassword: '', phone: '', studentId: '' };

// Client checks are only for quick feedback; the server re-validates everything.
function validate(f) {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = 'Full name is required';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address';
  if (f.password.length < 8 || !/[a-z]/.test(f.password) || !/[A-Z]/.test(f.password) || !/[0-9]/.test(f.password)) {
    e.password = 'Use 8+ characters with upper, lower case and a number';
  }
  if (f.confirmPassword !== f.password) e.confirmPassword = 'Passwords do not match';
  return e;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      const user = await register(form);
      toast.success('Account created. Welcome to LibraryHub!');
      navigate(homeForRole(user.role), { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Student registration is free and takes a minute." footer={<>Already registered? <Link to="/login">Log in</Link></>}>
      <form onSubmit={onSubmit} noValidate>
        <FormField id="fullName" name="fullName" label="Full name" autoComplete="name" value={form.fullName} onChange={onChange} error={errors.fullName} />
        <FormField id="email" name="email" type="email" label="Email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <div className="auth-card__row">
          <FormField id="password" name="password" type="password" label="Password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} />
          <FormField id="confirmPassword" name="confirmPassword" type="password" label="Confirm password" autoComplete="new-password" value={form.confirmPassword} onChange={onChange} error={errors.confirmPassword} />
        </div>
        <div className="auth-card__row">
          <FormField id="phone" name="phone" label="Phone (optional)" autoComplete="tel" value={form.phone} onChange={onChange} error={errors.phone} />
          <FormField id="studentId" name="studentId" label="Student ID (optional)" value={form.studentId} onChange={onChange} error={errors.studentId} />
        </div>
        <Button type="submit" loading={submitting}>Create account</Button>
      </form>
    </AuthLayout>
  );
}
