// src/components/RegistrationPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { Eye, EyeOff, Mail, Lock, CheckCircle, XCircle, Loader2, User } from 'lucide-react';

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // 'register' | 'confirm'
  const [form, setForm] = useState({
    email: '',
    username: '',
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

  const sanitize = (s = '') => s.trim();
  const stripSpaces = (s = '') => s.replace(/\s+/g, '');

  const onChange = (e) => {
    const { name, value } = e.target;
    const v = (name === 'email' || name === 'username') ? stripSpaces(value) : value;
    setForm((f) => ({ ...f, [name]: v }));
    if (err) setErr('');
    if (msg) setMsg('');
  };

  // ---------- Register ----------
  const onRegister = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');

    const email = stripSpaces(sanitize(form.email)).toLowerCase();
    const username = stripSpaces(sanitize(form.username));
    const password = form.password;
    const confirm = form.confirmPassword;

    if (!email || !username || !password || !confirm) {
      setErr('Please fill out all required fields.');
      return;
    }
    if (password !== confirm) {
      setErr('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await Auth.signUp({
        username,
        password,
        attributes: {
          email,
          given_name: sanitize(form.firstName),
          family_name: sanitize(form.lastName),
        },
      });
      setMsg('Registration successful! Check your email for the code.');
      setStep('confirm');
    } catch (e) {
      setErr(e?.message || e?.code || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Confirm ----------
  const onConfirm = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');

    const username = stripSpaces(sanitize(form.username));
    const c = stripSpaces(sanitize(code));
    if (!username || !c) {
      setErr('Enter your username and the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await Auth.confirmSignUp(username, c);
      setMsg('Account confirmed! Redirecting…');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (e) {
      setErr(e?.message || e?.code || 'Invalid confirmation code.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setErr(''); setMsg('');
    const username = stripSpaces(sanitize(form.username));
    if (!username) { setErr('Username is required to resend code.'); return; }
    setLoading(true);
    try {
      await Auth.resendSignUp(username);
      setMsg('Code resent. Check your email.');
    } catch (e) {
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
          <h1 className="text-xl font-semibold mb-6">Confirm your email</h1>

          {msg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-green-500/10 text-green-300 border border-green-500/20">
              <CheckCircle size={16} /> {msg}
            </div>
          )}
          {err && (
            <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-red-500/10 text-red-300 border border-red-500/20">
              <XCircle size={16} /> {err}
            </div>
          )}

          <form onSubmit={onConfirm} className="space-y-4" noValidate>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="Username"
                autoComplete="username"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none"
                required
              />
              <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            </div>

            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(stripSpaces(e.target.value))}
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none tracking-widest"
                required
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 font-medium disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Confirm
            </button>
          </form>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={resend}
              disabled={loading || !form.username}
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="w-full max-w-lg bg-slate-900/70 border border-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-semibold mb-6">Create your account</h1>

        {msg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-green-500/10 text-green-300 border border-green-500/20">
            <CheckCircle size={16} /> {msg}
          </div>
        )}
        {err && (
          <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-red-500/10 text-red-300 border border-red-500/20">
            <XCircle size={16} /> {err}
          </div>
        )}

        <form onSubmit={onRegister} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              placeholder="First name"
              className="w-full px-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none"
              required
            />
            <input
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              placeholder="Last name"
              className="w-full px-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none"
              required
            />
          </div>

          <div className="relative">
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
              placeholder="Username"
              autoComplete="username"
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none"
              required
            />
            <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          </div>

          <div className="relative">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="Email"
              autoComplete="email"
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none"
              required
            />
            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          </div>

          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="Password"
              autoComplete="new-password"
              className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none"
              required
            />
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <button type="button" className="absolute right-3 top-3.5 text-slate-400" onClick={() => setShowPwd(v => !v)}>
              {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showPwd2 ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none"
              required
            />
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <button type="button" className="absolute right-3 top-3.5 text-slate-400" onClick={() => setShowPwd2(v => !v)}>
              {showPwd2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 font-medium disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Create account
          </button>
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
