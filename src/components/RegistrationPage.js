// src/components/RegistrationPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import {
  Eye, EyeOff, Mail, Lock, CheckCircle, XCircle, Loader2,
  User as UserIcon, ArrowLeft, Info, ShieldCheck, KeyRound
} from 'lucide-react';

const clean = (s = '') => s.trim();
const lc = (s = '') => s.trim().toLowerCase();
const LOGO_SRC = "/DahTruthLogo.png"; // place DahTruthLogo.png in /public

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // 'register' | 'confirm'

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [code, setCode] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [showPwHelp, setShowPwHelp] = useState(false);
  const [agree, setAgree] = useState(false);

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') setAgree(checked);
    else setForm((f) => ({ ...f, [name]: value }));
    if (err) setErr('');
    if (msg) setMsg('');
  };

  // ---------- Register (username + email) ----------
  const onRegister = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');

    const username = clean(form.username);
    const email = lc(form.email);
    const pw = form.password;

    if (!form.firstName || !form.lastName || !username || !email || !pw || !form.confirmPassword) {
      setErr('Please complete all fields.');
      return;
    }
    if (!agree) {
      setErr('Please agree to the Terms and Privacy Policy.');
      return;
    }
    if (/\s/.test(username)) {
      setErr('Username cannot contain spaces.');
      return;
    }
    if (pw !== form.confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const signUpResult = await Auth.signUp({
        username,
        password: pw,
        attributes: {
          email,
          given_name: clean(form.firstName),
          family_name: clean(form.lastName),
          preferred_username: username,
        },
      });
      console.log('SignUp result:', signUpResult);
      localStorage.setItem('currentUser', JSON.stringify({ username, email }));
      setMsg('Registration successful! We sent a 6-digit code to your email.');
      setStep('confirm');
    } catch (e) {
      console.log('[SignUp error]', e);
      if (e?.code === 'UsernameExistsException') {
        setErr('That username is already taken. Please choose a different username.');
      } else if (e?.code === 'InvalidPasswordException') {
        setErr('Password must meet complexity rules.');
      } else if (e?.code === 'InvalidParameterException' && String(e?.message).toLowerCase().includes('email')) {
        setErr('Please enter a valid email address.');
      } else {
        setErr(e?.message || e?.code || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------- Confirm (accepts username OR email) ----------
  const onConfirm = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');

    const rawId = clean(form.username) || lc(form.email);
    const identifier = rawId.includes('@') ? lc(rawId) : rawId;
    const c = clean(code).replace(/\s+/g, '');

    if (!identifier || !c) {
      setErr('Enter your username or email and the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await Auth.confirmSignUp(identifier, c);
      console.log('Email confirmation successful');
      setMsg('Email confirmed successfully! Please sign in manually.');
      localStorage.removeItem('currentUser');
      setTimeout(() => navigate('/signin'), 1500);
    } catch (e) {
      console.log('[Confirm error]', e);
      if (e?.code === 'CodeMismatchException') setErr('Invalid code. Please check and try again.');
      else if (e?.code === 'ExpiredCodeException') setErr('Code expired. Click "Resend code".');
      else if (e?.code === 'NotAuthorizedException') setErr('Confirmation failed. Please try again.');
      else setErr(e?.message || e?.code || 'Could not confirm account.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- RESEND (accepts username OR email) ----------
  const resend = async () => {
    setErr(''); setMsg('');
    const raw = clean(form.username) || lc(form.email);
    if (!raw) { setErr('Enter your username or email to resend.'); return; }
    const identifier = raw.includes('@') ? lc(raw) : raw;

    setLoading(true);
    try {
      await Auth.resendSignUp(identifier);
      setMsg('Code resent. Check your email.');
    } catch (e) {
      console.log('[Resend error]', e);
      setErr(e?.message || e?.code || 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-base bg-radial-fade text-ink flex items-center justify-center p-6 relative overflow-hidden">
        <DecorBlobs />
        <div className="relative w-full max-w-md bg-white/80 backdrop-blur border border-border rounded-3xl p-10 shadow-2xl">
          <Header
            title="Confirm Your Account"
            subtitle="Enter the 6-digit code we sent to your email"
            icon={<Mail className="h-8 w-8 text-primary" />}
          />

          {msg && <Banner ok>{msg}</Banner>}
          {err && <Banner>{err}</Banner>}

          <form onSubmit={onConfirm} className="space-y-5" noValidate>
            <Input
              type="text"
              name="username"
              value={form.username}
              onChange={onChange}
              placeholder="Username (or leave blank and use email)"
              autoComplete="username"
              leftIcon={<UserIcon className="h-5 w-5" />}
            />
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="Email (optional if you filled username)"
              autoComplete="email"
              leftIcon={<Mail className="h-5 w-5" />}
            />
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              inputMode="numeric"
              leftIcon={<Mail className="h-5 w-5" />}
              required
            />

            <Button type="submit" loading={loading} grad>
              Confirm & Continue
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={resend}
                disabled={loading || (!form.username && !form.email)}
                className="text-primary hover:opacity-80 font-serif text-sm font-medium disabled:opacity-50 transition"
              >
                Didn’t receive the code? Resend
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => setStep('register')}
            className="w-full mt-6 text-muted hover:text-ink font-serif text-sm transition"
          >
            <span className="inline-flex items-center gap-2"><ArrowLeft size={16}/> Back to Registration</span>
          </button>
        </div>
      </div>
    );
  }

  // Register step
  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink flex items-center justify-center p-6 relative overflow-hidden">
      <DecorBlobs />
      <div className="relative w-full max-w-lg bg-white/80 backdrop-blur border border-border rounded-3xl p-10 shadow-2xl">
        <Header
          title="Create your account"
          subtitle="Begin your writing journey today"
        />

        {msg && <Banner ok>{msg}</Banner>}
        {err && <Banner>{err}</Banner>}

        <form onSubmit={onRegister} className="space-y-5" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <Input name="firstName" value={form.firstName} onChange={onChange} placeholder="First name" required />
            <Input name="lastName"  value={form.lastName}  onChange={onChange} placeholder="Last name"  required />
          </div>

          <Input
            type="text"
            name="username"
            value={form.username}
            onChange={onChange}
            placeholder="Username"
            autoComplete="username"
            required
            leftIcon={<UserIcon className="h-5 w-5" />}
          />

          <Input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email address"
            autoComplete="email"
            required
            leftIcon={<Mail className="h-5 w-5" />}
          />

          {/* Password + tooltip */}
          <div className="space-y-3">
            <Password
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="Password"
              show={showPwd}
              setShow={setShowPwd}
              autoComplete="new-password"
              rightAdornment={
                <PwInfoPopover open={showPwHelp} setOpen={setShowPwHelp} />
              }
            />

            <Password
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              placeholder="Confirm password"
              show={showPwd2}
              setShow={setShowPwd2}
              autoComplete="new-password"
            />
          </div>

          {/* Terms & Privacy */}
          <div className="flex items-start gap-3 rounded-xl bg-white/70 border border-border p-3">
            <input
              id="agree"
              type="checkbox"
              checked={agree}
              onChange={onChange}
              name="agree"
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              required
            />
            <label htmlFor="agree" className="text-sm text-ink">
              I agree to the{' '}
              <a href="/terms" className="text-primary hover:opacity-80 underline underline-offset-2">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-primary hover:opacity-80 underline underline-offset-2">Privacy Policy</a>.
            </label>
          </div>

          <Button type="submit" loading={loading} grad>
            Join the Story Lab
          </Button>
        </form>

        <div className="text-center mt-8">
          <p className="text-muted text-sm font-serif">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="text-primary hover:opacity-80 font-medium transition"
            >
              Sign in
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full mt-4 text-muted hover:text-ink font-serif text-sm transition"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

/* ---------- UI helpers (light/glass theme) ---------- */
function DecorBlobs() {
  return (
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply blur-xl animate-pulse" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-primary rounded-full mix-blend-multiply blur-xl animate-pulse" />
      <div className="absolute -bottom-10 left-24 w-64 h-64 bg-gold/60 rounded-full mix-blend-multiply blur-xl animate-pulse" />
    </div>
  );
}

function Header({ title, subtitle, icon }) {
  return (
    <div className="text-center mb-8">
      <div className="mx-auto w-16 h-16 rounded-full overflow-hidden border border-border bg-white/80 shadow">
        <img src={LOGO_SRC} alt="DahTruth Story Lab logo" className="w-full h-full object-contain" />
      </div>
      <h1 className="mt-3 text-xl font-bold font-serif tracking-tight">DahTruth Story Lab</h1>
      <p className="text-sm text-muted font-serif italic">Where the writing journey begins.</p>
      {icon ? (
        <div className="mt-4 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary p-3">
          {icon}
        </div>
      ) : null}
      <h2 className="mt-4 text-2xl font-bold font-serif">{title}</h2>
      {subtitle ? <p className="text-muted font-serif mt-1">{subtitle}</p> : null}
    </div>
  );
}

function Banner({ children, ok }) {
  return (
    <div className={`mb-5 p-3 rounded-xl flex items-center border ${
      ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
    }`}>
      {ok ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
      <span className="text-sm font-serif">{children}</span>
    </div>
  );
}

function Input({ leftIcon, className = '', ...props }) {
  return (
    <div className="relative">
      {leftIcon ? (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
          {leftIcon}
        </div>
      ) : null}
      <input
        {...props}
        className={`w-full ${leftIcon ? 'pl-12' : 'pl-4'} pr-4 py-3 bg-white border border-border rounded-xl 
          text-ink placeholder:text-muted backdrop-blur-sm
          focus:border-primary focus:outline-none transition ${className}`}
      />
    </div>
  );
}

function Password({ name, value, onChange, placeholder, show, setShow, autoComplete, rightAdornment }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
        <Lock className="h-5 w-5" />
      </div>
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full pl-12 pr-12 py-3 bg-white border border-border rounded-xl 
          text-ink placeholder:text-muted backdrop-blur-sm
          focus:border-primary focus:outline-none transition"
        required
      />
      <button
        type="button"
        className="absolute inset-y-0 right-9 pr-2 flex items-center text-muted hover:text-ink transition"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
      {/* Right adornment (tooltip trigger) */}
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        {rightAdornment || null}
      </div>
    </div>
  );
}

function Button({ children, loading, grad, ...rest }) {
  const base = grad
    ? 'bg-gradient-to-r from-accent to-primary text-ink hover:opacity-90'
    : 'bg-primary text-white hover:opacity-90';
  return (
    <button
      {...rest}
      disabled={loading}
      className={`w-full ${base} py-3 px-6 rounded-xl font-serif font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl`}
    >
      {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
      {children}
    </button>
  );
}

/* Password tooltip (popover) */
function PwInfoPopover({ open, setOpen }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-white/70 border border-border"
        aria-expanded={open}
        aria-label="Password requirements"
      >
        <Info className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-72 z-10 rounded-xl bg-white border border-border shadow-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-ink">Password requirements</span>
          </div>
          <ul className="text-sm text-ink/80 space-y-1">
            <li className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> At least 8 characters</li>
            <li className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> One uppercase letter</li>
            <li className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> One lowercase letter</li>
            <li className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> One number</li>
            <li className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> One special character</li>
          </ul>
        </div>
      )}
    </div>
  );
}
