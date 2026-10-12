import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import { authApi } from '../../services/authService';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/common/Toast';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address');
    setError('');
    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we will start a reset." footer={<Link to="/login">Back to login</Link>}>
      {sent ? (
        <p role="status">If an account exists for <strong>{email}</strong>, a reset link has been generated. Check your inbox, or ask your library administrator if email delivery is not set up yet.</p>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FormField id="email" type="email" label="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <Button type="submit" loading={submitting}>Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
