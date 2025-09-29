// src/components/SignInPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import {
  Mail, User as UserIcon, Lock, Eye, EyeOff,
  Loader2, XCircle, CheckCircle, ArrowLeft
} from 'lucide-react';

const lc = (s='') => s.trim().toLowerCase();
const LOGO_SRC = "/DahTruthLogo.png"; // place DahTruthLogo.png in /public

export default function SignInPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'forgot' | 'reset' | 'newpwd'
  const [idMode, setIdMode] = useState('username'); // 'username' | 'email'

  // fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [challengedUser, setChallengedUser] = useState(null);

  // Prefill from registration if present
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (saved?.username) { setUsername(saved.username); setIdMode('username'); }
      if (saved?.email)    { setEmail(saved.email); }
    } catch {}
  }, []);

  // identifier helper
  const getIdentifier = () => (idMode === 'email' ? lc(email || '') : (username || '').trim());

  const signIn = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    const identifier = getIdentifier();
    if (!identifier || !password) return setErr(`Enter your ${idMode} and password.`);

    setLoading(true);
    try {
      const user = await Auth.signIn(identifier, password);
      if (user?.challengeName === 'NEW_PASSWORD_REQUIRED') {
        setChallengedUser(user);
        setMode('newpwd');
        setMsg('Set a new password to finish signing in.');
        return;
      }
      await Auth.currentAuthenticatedUser({ bypassCache: true });
      localStorage.removeItem('currentUser');
      navigate('/dashboard');
    } catch (e) {
      console.log('[SignIn error]', e);
      if (e?.code === 'UserNotConfirmedException') setErr('Please confirm your email first. Check your inbox for the code.');
      else if (e?.code === 'NotAuthorizedException') setErr('Incorrect credentials. Try again or use “Forgot password”.');
      else if (e?.code === 'UserNotFoundException') setErr(`No account found for that ${idMode}.`);
      else if (e?.code === 'TooManyRequestsException') setErr('Too many attempts. Please wait a few minutes and try again.');
      else if (e?.code === 'PasswordResetRequiredException') setErr('Password reset required. Use “Forgot password”.');
      else setErr(e?.message || e?.code || 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const completeNewPassword = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!challengedUser) return setErr('No pending challenge.');
    if (!newPassword) return setErr('Enter a new password.');

    setLoading(true);
    try {
      await Auth.completeNewPassword(challengedUser, newPassword);
      await Auth.currentAuthenticatedUser({ bypassCache: true });
      navigate('/dashboard');
    } catch (e) {
      console.log('[CompleteNewPassword error]', e);
      setErr(e?.message || e?.code || 'Could not set new password.');
    } finally {
      setLoading(false);
    }
  };

  const forgotStart = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    const identifier = getIdentifier();
    if (!identifier) return setErr(`Enter your ${idMode} first.`);

    setLoading(true);
    try {
      await Auth.forgotPassword(identifier);
      setMsg('We sent a reset code to your email.');
      setMode('reset');
    } catch (e) {
      console.log('[Forgot error]', e);
      if (e?.code === 'UserNotFoundException') setErr(`No account found for that ${idMode}.`);
      else if (e?.code === 'TooManyRequestsException') setErr('Too many requests. Please try again later.');
      else setErr(e?.message || e?.code || 'Could not start password reset.');
    } finally {
      setLoading(false);
    }
  };

  const forgotComplete = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    const identifier = getIdentifier();
    const resetCode = (code || '').trim();
    if (!identifier || !resetCode || !newPassword) {
      return setErr(`Enter ${idMode}, the 6-digit code, and a new password.`);
    }

    setLoading(true);
    try {
      await Auth.forgotPasswordSubmit(identifier, resetCode, newPassword);
      setMsg('Password updated! You can sign in now.');
      setPassword('');
      setTimeout(() => setMode('signin'), 1500);
    } catch (e) {
      console.log('[Forgot submit error]', e);
      if (e?.code === 'CodeMismatchException') setErr('Invalid code. Please check and try again.');
      else if (e?.code === 'ExpiredCodeException') setErr('Code expired. Click “Resend code”.');
      else if (e?.code === 'InvalidPasswordException') setErr('Password must meet complexity rules.');
      else setErr(e?.message || e?.code || 'Could not set new password.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setErr(''); setMsg('');
    const identifier = getIdentifier();
    if (!identifier) return setErr(`Enter your ${idMode} first.`);
    setLoading(true);
    try {
      await Auth.forgotPassword(identifier);
      setMsg('Code resent. Check your email.');
    } catch (e) {
      console.log('[Resend code error]', e);
      setErr(e?.message || e?.code || 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  };

  const Back = () => (
    <button
      type="button"
      onClick={() => { setErr(''); setMsg(''); setMode('signin'); }}
      className="mb-4 inline-flex items-center gap-2 text-muted hover:text-ink"
    >
      <ArrowLeft size={16}/> Back to sign in
    </button>
  );

  const IdToggle = () => (
    <div className="flex items-center justify-center gap-2 mb-2">
      <button
        type="button"
        onClick={() => setIdMode('username')}
        className={`px-3 py-1 rounded-md text-sm border transition-colors ${
          idMode==='username'
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-ink border-border hover:bg-white/80'
        }`}
      >
        Use Username
      </button>
      <button
        type="button"
        onClick={() => setIdMode('email')}
        className={`px-3 py-1 rounded-md text-sm border transition-colors ${
          idMode==='email'
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-ink border-border hover:bg-white/80'
        }`}
      >
        Use Email
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink flex items-center justify-center p-6 relative overflow-hidden">
      {/* soft background blobs */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-accent blur-2xl" />
        <div className="absolute top-20 right-10 w-80 h-80 rounded-full bg-primary blur-2xl" />
        <div className="absolute -bottom-12 left-20 w-64 h-64 rounded-full bg-gold/60 blur-2xl" />
      </div>

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur border border-border rounded-2xl p-6 shadow-xl">
        {/* Brand header */}
        <div className="text-center mb-5">
          <div className="mx-auto w-16 h-16 rounded-full overflow-hidden border border-border bg-white/80 shadow">
            <img src={LOGO_SRC} alt="DahTruth Story Lab logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="mt-3 text-xl font-bold font-serif tracking-tight">DahTruth Story Lab</h1>
          <p className="text-sm text-muted font-serif italic">Where the writing journey begins.</p>
        </div>

        {mode !== 'signin' && <Back />}

        <h2 className="text-2xl font-semibold mb-2">
          {mode === 'signin' ? 'Sign in' : mode === 'forgot' ? 'Forgot password' : mode === 'reset' ? 'Reset password' : 'Set new password'}
        </h2>
        {mode !== 'newpwd' && <IdToggle />}

        {msg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle size={16}/> {msg}
          </div>
        )}
        {err && (
          <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle size={16}/> {err}
          </div>
        )}

        {mode === 'signin' && (
          <form onSubmit={signIn} className="space-y-4" noValidate>
            {/* Username */}
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e=>setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                className={`w-full pl-10 pr-3 py-3 rounded-lg border outline-none transition-colors placeholder:text-muted ${
                  idMode==='username'
                    ? 'bg-white border-primary focus:border-primary'
                    : 'bg-white border-border focus:border-border'
                }`}
                required={idMode==='username'}
              />
              <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted"/>
            </div>

            {/* Email */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                className={`w-full pl-10 pr-3 py-3 rounded-lg border outline-none transition-colors placeholder:text-muted ${
                  idMode==='email'
                    ? 'bg-white border-primary focus:border-primary'
                    : 'bg-white border-border focus:border-border'
                }`}
                required={idMode==='email'}
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted"/>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 rounded-lg bg-white border border-border outline-none placeholder:text-muted focus:border-primary transition-colors"
                required
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted"/>
              <button type="button" className="absolute right-3 top-3.5 text-muted hover:text-ink" onClick={()=>setShowPwd(v=>!v)}>
                {showPwd ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white hover:opacity-90 px-4 py-3 font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Sign in
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={()=>{setErr('');setMsg('');setMode('forgot');}}
                className="text-primary hover:opacity-80 text-sm transition"
              >
                Forgot password?
              </button>

              <div className="pt-4 border-t border-border">
                <p className="text-muted text-sm mb-2">Don't have an account?</p>
                <button
                  type="button"
                  onClick={() => navigate('/auth/register')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent hover:opacity-90 px-4 py-2 font-medium text-ink transition"
                >
                  Create Account
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-muted hover:text-ink text-sm transition"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={forgotStart} className="space-y-4" noValidate>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e=>setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                className={`w-full pl-10 pr-3 py-3 rounded-lg border outline-none transition-colors placeholder:text-muted ${
                  idMode==='username'
                    ? 'bg-white border-primary focus:border-primary'
                    : 'bg-white border-border focus:border-border'
                }`}
                required={idMode==='username'}
              />
              <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted"/>
            </div>

            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                className={`w-full pl-10 pr-3 py-3 rounded-lg border outline-none transition-colors placeholder:text-muted ${
                  idMode==='email'
                    ? 'bg-white border-primary focus:border-primary'
                    : 'bg-white border-border focus:border-border'
                }`}
                required={idMode==='email'}
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted"/>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white hover:opacity-90 px-4 py-3 font-medium disabled:opacity-60 transition"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Send reset code
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={forgotComplete} className="space-y-4" noValidate>
            <div className="text-xs text-muted -mt-1">
              Reset will use your <span className="font-semibold">{idMode}</span>.
            </div>

            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={e=>setCode(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                inputMode="numeric"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-white border border-border outline-none tracking-widest placeholder:text-muted focus:border-primary transition-colors"
                required
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted"/>
            </div>

            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={e=>setNewPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-3 rounded-lg bg-white border border-border outline-none placeholder:text-muted focus:border-primary transition-colors"
                required
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted"/>
              <button type="button" className="absolute right-3 top-3.5 text-muted hover:text-ink" onClick={()=>setShowPwd(v=>!v)}>
                {showPwd ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>

            <div className="text-xs text-muted bg-white/70 border border-border p-3 rounded-lg">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white hover:opacity-90 px-4 py-3 font-medium disabled:opacity-60 transition"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Set new password
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={resendCode}
                disabled={loading || (!username && !email)}
                className="text-primary hover:opacity-80 text-sm disabled:opacity-50 transition"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {mode === 'newpwd' && (
          <form onSubmit={completeNewPassword} className="space-y-4" noValidate>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={e=>setNewPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-3 rounded-lg bg-white border border-border outline-none placeholder:text-muted focus:border-primary transition-colors"
                required
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted"/>
              <button type="button" className="absolute right-3 top-3.5 text-muted hover:text-ink" onClick={()=>setShowPwd(v=>!v)}>
                {showPwd ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white hover:opacity-90 px-4 py-3 font-medium disabled:opacity-60 transition"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
