import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { getErrorMessage } from '../../services/api';
import { homeForRole } from '../../utils/roles';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      navigate(location.state?.from?.pathname || homeForRole(user.role), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your LibraryHub account."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} noValidate>
        <FormField id="email" name="email" type="email" label="Email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <FormField id="password" name="password" type="password" label="Password" autoComplete="current-password" value={form.password} onChange={onChange} error={errors.password} />
        <p className="auth-card__forgot"><Link to="/forgot-password">Forgot password?</Link></p>
        <Button type="submit" loading={submitting}>Log in</Button>
      </form>
    </AuthLayout>
  );
}
