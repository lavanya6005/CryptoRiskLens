import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.confirm) errs.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/dashboard'); }, 1000);
  };

  const set = (field) => (e) => { setForm({ ...form, [field]: e.target.value }); setErrors({ ...errors, [field]: '' }); };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-brand">
          <span className="auth-brand__icon">₿</span>
          <span className="auth-brand__text">CryptoRisk</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Start analyzing your portfolio risk in minutes. Free to get started.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input id="reg-name" label="Full name" placeholder="Alex Johnson" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
          <Input id="reg-email" label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
          <div className="auth-row">
            <Input id="reg-pass" label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
            <Input id="reg-confirm" label="Confirm password" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
          </div>

          <div className="auth-terms">
            <input type="checkbox" id="terms" required />
            <label htmlFor="terms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
          </div>

          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>

      <div className="auth-side">
        <blockquote className="auth-quote">
          "The risk analysis dashboard is the clearest I've seen. It immediately showed 
          me I was over-exposed to Solana."
        </blockquote>
        <cite className="auth-cite">— James Park, crypto trader</cite>
      </div>
    </div>
  );
}
