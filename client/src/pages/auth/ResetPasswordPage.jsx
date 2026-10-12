import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import { authApi } from '../../services/authService';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/common/Toast';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    const p = form.newPassword;
    if (p.length < 8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) next.newPassword = 'Use 8+ characters with upper, lower case and a number';
    if (form.confirm !== p) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword: p });
      toast.success('Password reset. Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Reset links can be used once and expire quickly." footer={<Link to="/login">Back to login</Link>}>
      {!token ? (
        <p role="alert">This reset link is missing its token. Please request a new one from the <Link to="/forgot-password">forgot password page</Link>.</p>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FormField id="newPassword" name="newPassword" type="password" label="New password" autoComplete="new-password" value={form.newPassword} onChange={onChange} error={errors.newPassword} />
          <FormField id="confirm" name="confirm" type="password" label="Confirm new password" autoComplete="new-password" value={form.confirm} onChange={onChange} error={errors.confirm} />
          <Button type="submit" loading={submitting}>Reset password</Button>
        </form>
      )}
    </AuthLayout>
  );
}
