// src/components/SignInPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { Mail, User, Lock, Eye, EyeOff, Loader2, XCircle, CheckCircle } from 'lucide-react';

export default function SignInPage() {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!id || !password) { setErr('Please enter your username/email and password.'); return; }

    setLoading(true);
    try {
      // 1) Sign in
      await Auth.signIn(id, password);
      // 2) Force-refresh the current user so tokens are definitely stored
      await Auth.currentAuthenticatedUser({ bypassCache: true });
      // 3) Navigate to a protected route
      navigate('/dashboard');
    } catch (e) {
      if (e?.code === 'UserNotConfirmedException') {
        setErr('Account not confirmed. Check your email or confirm your registration.');
      } else if (e?.code === 'NotAuthorizedException') {
        setErr('Incorrect username/email or password.');
      } else {
        setErr(e?.message || e?.code || 'Sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md bg-slate-900/70 border border-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-semibold mb-6">Sign in</h1>

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

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="relative">
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value.trim())}
              placeholder="Username or email"
              autoComplete="username"
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none"
              required
            />
            {id.includes('@')
              ? <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              : <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />}
          </div>

          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none"
              required
            />
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <button type="button" className="absolute right-3 top-3.5 text-slate-400" onClick={() => setShowPwd(v => !v)}>
              {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 font-medium disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Sign in
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/auth/register')}
            className="text-indigo-300 hover:text-indigo-200 text-sm"
          >
            Need an account? Register
          </button>
        </div>
      </div>
    </div>
  );
}
