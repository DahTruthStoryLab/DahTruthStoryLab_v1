// src/components/RegistrationPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { Eye, EyeOff, Mail, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const clean = (s = '') => s.trim();
const lc = (s = '') => s.trim().toLowerCase();

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // <-- plain JS

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });

  const [code, setCode] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (err) setErr('');
    if (msg) setMsg('');
  };

  // ---------- Register (email becomes the Cognito username) ----------
  const onRegister = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');

    const email = lc(form.email);
    const pw = form.password;

    if (!email || !pw || !form.confirmPassword || !form.firstName || !form.lastName) {
      setErr('Please complete all fields.');
      return;
    }
    if (pw !== form.confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await Auth.signUp({
        username: email, // email as username
        password: pw,
        attributes: {
          email,
          given_name: clean(form.firstName),
          family_name: clean(form.lastName),
        },
      });

      localStorage.setItem('currentUser', JSON.stringify({ email }));
      setMsg('Registration successful! Check your email for the 6-digit confirmation code.');
      setStep('confirm');
    } catch (e) {
      console.log('[SignUp error]', e);
      if (e?.code === 'UsernameExistsException') {
        setErr('An account with this email already exists. Try signing in or use “Forgot password?” on the sign-in page.');
      } else {
        setErr(e?.message || e?.code || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------- Confirm then AUTO SIGN-IN ----------
  const onConfirm = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');

    const email = lc(form.email);
    const c = clean(code).replace(/\s+/g, '');
    if (!email || !c) {
      setErr('Enter your email and the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await Auth.confirmSignUp(email, c);         // confirm account

      // Immediately sign in with the password they just set
      await Auth.signIn(email, form.password);
      await Auth.currentAuthenticatedUser({ bypassCache: true });

      setMsg('Email confirmed! Redirecting…');
      navigate('/dashboard');
    } catch (e) {
      console.log('[Confirm/signin error]', e);
      if (e?.code === 'CodeMismatchException') setErr('Invalid code. Please check and try again.');
      else if (e?.code === 'ExpiredCodeException') setErr('Code expired. Click “Resend code”.');
      else if (e?.code === 'NotAuthorizedException') setErr('Confirmation succeeded, but the password was not accepted. Use “Forgot password?” on the Sign In page.');
      else setErr(e?.message || e?.code || 'Could not confirm/sign in.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setErr(''); setMsg('');
    const email = lc(form.email);
    if (!email) { setErr('Enter your email to resend.'); return; }
    setLoading(true);
    try {
      await Auth.resendSignUp(email);
      setMsg('Code resent. Check your email.');
    } catch (e) {
      console.log('[Resend error]', e);
      setErr(e?.message || e?.code || 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  if (step === 'confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="w-full max-w-md bg-slate-900/70 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Confirm your email</h2>

          {msg && <Banner ok>{msg}</Banner>}
          {err && <Banner>{err}</Banner>}

          <form onSubmit={onConfirm} className="space-y-4" noValidate>
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="Email"
              icon="mail"
              autoComplete="email"
              required
            />
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              inputMode="numeric"
              icon="mail"
              required
            />
            <Button type="submit" loading={loading} color="green">
              Confirm & continue
            </Button>
          </form>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={resend}
              disabled={loading || !form.email}
              className="text-indigo-300 hover:text-indigo-200 text-sm"
            >
              Resend code
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep('register')}
            className="w-full mt-6 text-indigo-300 text-sm hover:text-indigo-200"
          >
            ← Back to registration
          </button>
        </div>
      </div>
    );
  }

  // Register UI
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="w-full max-w-lg bg-slate-900/70 border border-white/10 rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">Create your account</h2>

        {msg && <Banner ok>{msg}</Banner>}
        {err && <Banner>{err}</Banner>}

        <form onSubmit={onRegister} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Input name="firstName" value={form.firstName} onChange={onChange} placeholder="First name" required />
            <Input name="lastName"  value={form.lastName}  onChange={onChange} placeholder="Last name"  required />
          </div>

          <Input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
            icon="mail"
            autoComplete="email"
            required
          />

          <Password
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
            show={showPwd}
            setShow={setShowPwd}
            autoComplete="new-password"
            required
          />

          <Password
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder="Confirm password"
            show={showPwd2}
            setShow={setShowPwd2}
            autoComplete="new-password"
            required
          />

          <Button type="submit" loading={loading}>Create account</Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="text-indigo-300 hover:text-indigo-200 text-sm"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- tiny presentational helpers --- */
function Banner({ children, ok }) {
  return (
    <div className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${ok ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
      {ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {children}
    </div>
  );
}
function Input(props) {
  const { icon, className = '', ...rest } = props;
  return (
    <div className="relative">
      <input
        {...rest}
        className={`w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none ${className}`}
      />
      {icon === 'mail' ? (
        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
      ) : null}
    </div>
  );
}
function Password({ name, value, onChange, placeholder, show, setShow, autoComplete, required }) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none"
        required={required}
      />
      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
      <button
        type="button"
        className="absolute right-3 top-3.5 text-slate-400"
        onClick={() => setShow(v => !v)}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
function Button({ children, loading, color = 'indigo', ...rest }) {
  const base = color === 'green' ? 'bg-green-600 hover:bg-green-500' : 'bg-indigo-600 hover:bg-indigo-500';
  return (
    <button
      {...rest}
      disabled={loading}
      className={`w-full inline-flex items-center justify-center gap-2 rounded-lg ${base} px-4 py-2 font-medium disabled:opacity-60`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
