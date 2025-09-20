// src/components/SignInPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { Mail, Lock, Eye, EyeOff, Loader2, XCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const lc = (s='') => s.trim().toLowerCase();

export default function SignInPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'forgot' | 'reset' | 'newpwd'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [challengedUser, setChallengedUser] = useState(null);

  // Prefill from registration
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (saved?.email) setEmail(lc(saved.email));
    } catch {}
  }, []);

  const signIn = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    const id = lc(email);
    if (!id || !password) return setErr('Enter your email and password.');
    setLoading(true);
    try {
      const user = await Auth.signIn(id, password);

      // Handle NEW_PASSWORD_REQUIRED (rare, but breaks sign-in if not handled)
      if (user?.challengeName === 'NEW_PASSWORD_REQUIRED') {
        setChallengedUser(user);
        setMode('newpwd');
        setMsg('Set a new password to finish signing in.');
        return;
      }

      await Auth.currentAuthenticatedUser({ bypassCache: true });
      navigate('/dashboard');
    } catch (e) {
      console.log('[SignIn error]', e);
      if (e?.code === 'UserNotConfirmedException') setErr('Please confirm your email before signing in.');
      else if (e?.code === 'NotAuthorizedException') setErr('Incorrect email or password.');
      else if (e?.code === 'UserNotFoundException') setErr('No account found for that email.');
      else setErr(e?.message || e?.code || 'Sign-in failed.');
    } finally { setLoading(false); }
  };

  const completeNewPassword = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
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
    } finally { setLoading(false); }
  };

  const forgotStart = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    const id = lc(email);
    if (!id) return setErr('Enter your email.');
    setLoading(true);
    try {
      await Auth.forgotPassword(id);
      setMsg('We sent a reset code to your email.'); setMode('reset');
    } catch (e) {
      console.log('[Forgot error]', e);
      if (e?.code === 'UserNotFoundException') setErr('No account found for that email.');
      else setErr(e?.message || e?.code || 'Could not start password reset.');
    } finally { setLoading(false); }
  };

  const forgotComplete = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    const id = lc(email); const c = code.trim();
    if (!id || !c || !newPassword) return setErr('Enter email, the 6-digit code, and a new password.');
    setLoading(true);
    try {
      await Auth.forgotPasswordSubmit(id, c, newPassword);
      setMsg('Password updated! You can sign in now.');
      setTimeout(() => setMode('signin'), 700);
    } catch (e) {
      console.log('[Forgot submit error]', e);
      if (e?.code === 'CodeMismatchException') setErr('Invalid code.');
      else if (e?.code === 'ExpiredCodeException') setErr('Code expired. Click “Resend code”.');
      else setErr(e?.message || e?.code || 'Could not set new password.');
    } finally { setLoading(false); }
  };

  const resendCode = async () => {
    setErr(''); setMsg(''); const id = lc(email);
    if (!id) return setErr('Enter your email first.');
    setLoading(true);
    try { await Auth.forgotPassword(id); setMsg('Code resent. Check your email.'); }
    catch (e) { console.log('[Resend code error]', e); setErr(e?.message || e?.code || 'Could not resend code.'); }
    finally { setLoading(false); }
  };

  const Back = () => (
    <button type="button" onClick={() => { setErr(''); setMsg(''); setMode('signin'); }}
            className="mb-4 inline-flex items-center gap-2 text-slate-300 hover:text-white">
      <ArrowLeft size={16}/> Back to sign in
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md bg-slate-900/70 border border-white/10 rounded-2xl p-6">
        {mode !== 'signin' && <Back />}
        <h1 className="text-2xl font-semibold mb-6">
          {mode === 'signin' ? 'Sign in' : mode === 'forgot' ? 'Forgot password' : mode === 'reset' ? 'Reset password' : 'Set new password'}
        </h1>

        {msg && <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-green-500/10 text-green-300 border border-green-500/20"><CheckCircle size={16}/> {msg}</div>}
        {err && <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-red-500/10 text-red-300 border border-red-500/20"><XCircle size={16}/> {err}</div>}

        {mode === 'signin' && (
          <form onSubmit={signIn} className="space-y-4" noValidate>
            <div className="relative">
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                     placeholder="Email" autoComplete="email"
                     className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none" required />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
            </div>
            <div className="relative">
              <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                     placeholder="Password" autoComplete="current-password"
                     className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none" required />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
              <button type="button" className="absolute right-3 top-3.5 text-slate-400" onClick={()=>setShowPwd(v=>!v)}>
                {showPwd ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            <button type="submit" disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 font-medium disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Sign in
            </button>
            <div className="text-center">
              <button type="button" onClick={()=>{setErr('');setMsg('');setMode('forgot');}}
                      className="text-indigo-300 hover:text-indigo-200 text-sm">Forgot password?</button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={forgotStart} className="space-y-4" noValidate>
            <div className="relative">
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                     placeholder="Email" autoComplete="email"
                     className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none" required />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
            </div>
            <button type="submit" disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 font-medium disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Send reset code
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={forgotComplete} className="space-y-4" noValidate>
            <div className="relative">
              <input type="text" value={code} onChange={e=>setCode(e.target.value)}
                     placeholder="6-digit code" maxLength={6} inputMode="numeric"
                     className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none tracking-widest" required />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
            </div>
            <div className="relative">
              <input type={showPwd?'text':'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                     placeholder="New password" autoComplete="new-password"
                     className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none" required />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
              <button type="button" className="absolute right-3 top-3.5 text-slate-400" onClick={()=>setShowPwd(v=>!v)}>
                {showPwd ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            <button type="submit" disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 font-medium disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Set new password
            </button>
            <div className="text-center">
              <button type="button" onClick={resendCode} disabled={loading || !email}
                      className="text-indigo-300 hover:text-indigo-200 text-sm">Resend code</button>
            </div>
          </form>
        )}

        {mode === 'newpwd' && (
          <form onSubmit={completeNewPassword} className="space-y-4" noValidate>
            <div className="relative">
              <input type={showPwd?'text':'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                     placeholder="New password" autoComplete="new-password"
                     className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none" required />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
              <button type="button" className="absolute right-3 top-3.5 text-slate-400" onClick={()=>setShowPwd(v=>!v)}>
                {showPwd ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            <button type="submit" disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 font-medium disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
