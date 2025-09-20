// src/components/RegistrationPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { Eye, EyeOff, Mail, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const clean = (s = '') => s.trim();
const lc = (s = '') => s.trim().toLowerCase();

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // 'register' | 'confirm'  ← plain JS

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

  // ---------- Register (email becomes Cognito username) ----------
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
        username: email, // EMAIL as username (no separate username field)
        password: pw,
        attributes: {
          email,
          given_name: clean(form.firstName),
          family_name: clean(form.lastName),
        },
      });

      localStorage.setItem('currentUser', JSON.stringify({ email }));
      setMsg('Registration successful! We sent a 6-digit code to your email.');
      setStep('confirm');
    } catch (e) {
      console.log('[SignUp error]', e);
      if (e?.code === 'UsernameExistsException') {
        setErr('An account with this email already exists. Try Sign In or “Forgot password?”.');
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
      await Auth.confirmSignUp(email, c);
      await Auth.signIn(email, form.password); // auto sign-in
      await Auth.currentAuthenticatedUser({ bypassCache: true });
      setMsg('Email confirmed! Redirecting…');
      navigate('/dashboard');
    } catch (e) {
      console.log('[Confirm/signin error]', e);
      if (e?.code === 'CodeMismatchException') setErr('Invalid code. Please check and try again.');
      else if (e?.code === 'ExpiredCodeException') setErr('Code expired. Click “Resend code”.');
      else if (e?.code === 'NotAuthorizedException') setErr('Confirmation worked, but password was not accepted. Use “Forgot password?” on Sign In.');
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

  // ---------- UI (keeps your “beautiful” styling) ----------
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* animated blobs */}
        <DecorBlobs />
        <div className="relative z-10 bg-blue-950/50 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-md border border-blue-800/40">
          <Header title="Confirm Your Email" icon={<Mail className="h-10 w-10 text-blue-300" />} />
          {msg && <Banner ok>{msg}</Banner>}
          {err && <Banner>{err}</Banner>}

          <form onSubmit={onConfirm} className="space-y-6" noValidate>
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="Email"
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
            />
            <Button type="submit" loading={loading} grad>
              Confirm & Continue
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={resend}
                disabled={loading || !form.email}
                className="text-blue-300 hover:text-blue-100 font-serif text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Didn’t receive the code? Resend
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => setStep('register')}
            className="w-full mt-6 text-blue-300 text-sm hover:text-blue-100 font-serif transition-colors"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    );
  }

  // Register step
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* animated blobs */}
      <DecorBlobs />
      <div className="relative z-10 bg-blue-950/50 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-lg border border-blue-800/40">
        <Header title="Join DahTruth Story Lab" subtitle="Begin your writing journey today" />
        {msg && <Banner ok>{msg}</Banner>}
        {err && <Banner>{err}</Banner>}

        <form onSubmit={onRegister} className="space-y-6" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              placeholder="First Name"
              required
            />
            <Input
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              placeholder="Last Name"
              required
            />
          </div>

          <Input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email Address"
            autoComplete="email"
            required
            leftIcon={<Mail className="h-5 w-5" />}
          />

          <Password
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
            show={showPwd}
            setShow={setShowPwd}
            autoComplete="new-password"
          />

          <Password
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder="Confirm Password"
            show={showPwd2}
            setShow={setShowPwd2}
            autoComplete="new-password"
          />

          <div className="text-sm text-blue-200 bg-blue-900/30 p-4 rounded-xl font-serif backdrop-blur-sm">
            Password must contain at least 8 characters with uppercase, lowercase, number, and special character.
          </div>

          <Button type="submit" loading={loading} grad>
            Join the Story Lab
          </Button>
        </form>

        <div className="text-center mt-8">
          <p className="text-blue-200 text-sm font-serif">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="text-blue-300 hover:text-blue-100 font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full mt-4 text-blue-300 text-sm hover:text-blue-100 font-serif transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

/* ---------- Pretty UI helpers (match your original look) ---------- */
function DecorBlobs() {
  return (
    <div className="absolute inset-0 opacity-15">
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
    </div>
  );
}

function Header({ title, subtitle, icon }) {
  return (
    <div className="text-center mb-10">
      <div className="w-20 h-20 rounded-full overflow-hidden shadow-2xl border-2 border-blue-400/30 mx-auto mb-6">
        <img src="/dahtruth-logo.png" alt="DahTruth Story Lab Logo" className="w-full h-full object-cover" />
      </div>
      {icon ? (
        <div className="bg-blue-600/30 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          {icon}
        </div>
      ) : null}
      <h2 className="text-3xl font-bold text-white font-serif mb-3">{title}</h2>
      {subtitle ? <p className="text-blue-200 font-serif">{subtitle}</p> : null}
    </div>
  );
}

function Banner({ children, ok }) {
  return (
    <div className={`mb-6 p-4 rounded-xl flex items-center backdrop-blur-sm border ${ok ? 'bg-green-500/20 border-green-400/30 text-green-100' : 'bg-red-500/20 border-red-400/30 text-red-100'}`}>
      {ok ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
      <span className="text-sm font-serif">{children}</span>
    </div>
  );
}

function Input({ leftIcon, className = '', ...props }) {
  return (
    <div className="relative group">
      {leftIcon ? <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-300">{leftIcon}</div> : null}
      <input
        {...props}
        className={`w-full ${leftIcon ? 'pl-12' : 'pl-4'} pr-4 py-4 bg-blue-900/30 border border-blue-700/50 rounded-xl 
          text-white placeholder-blue-300 backdrop-blur-sm
          focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-900/40
          transition-all duration-300 font-serif ${className}`}
      />
    </div>
  );
}

function Password({ name, value, onChange, placeholder, show, setShow, autoComplete }) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Lock className="h-5 w-5 text-blue-300" />
      </div>
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full pl-12 pr-12 py-4 bg-blue-900/30 border border-blue-700/50 rounded-xl 
          text-white placeholder-blue-300 backdrop-blur-sm
          focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-900/40
          transition-all duration-300 font-serif"
        required
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-blue-100 transition-colors"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

function Button({ children, loading, grad, ...rest }) {
  const base = grad
    ? 'bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400'
    : 'bg-indigo-600 hover:bg-indigo-500';
  return (
    <button
      {...rest}
      disabled={loading}
      className={`w-full ${base} text-white py-4 px-6 rounded-xl font-serif font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105`}
    >
      {loading ? <Loader2 className="animate-spin h-6 w-6 mr-2" /> : null}
      {children}
    </button>
  );
}
