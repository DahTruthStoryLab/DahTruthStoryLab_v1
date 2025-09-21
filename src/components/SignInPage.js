// src/components/SignInPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { Mail, Lock, Eye, EyeOff, Loader2, XCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const lc = (s='') => s.trim().toLowerCase();

export default function SignInPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'forgot' | 'reset' | 'newpwd'
  const [username, setUsername] = useState(''); // can be username OR email
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
    try { 
      const saved = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (saved?.username) setUsername(saved.username);
      else if (saved?.email) setUsername(saved.email);
    } catch {}
  }, []);

  const signIn = async (e) => {
    e.preventDefault(); 
    setErr(''); 
    setMsg('');
    
    const raw = (username || '').trim();
    if (!raw || !password) return setErr('Enter your username or email and password.');

    // If it looks like an email, normalize to lowercase
    const identifier = raw.includes('@') ? lc(raw) : raw;
    
    setLoading(true);
    try {
      const user = await Auth.signIn(identifier, password);

      // Handle NEW_PASSWORD_REQUIRED challenge
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
      if (e?.code === 'UserNotConfirmedException') {
        setErr('Please confirm your email first. Check your inbox for the code.');
      } else if (e?.code === 'NotAuthorizedException') {
        setErr('Incorrect username/email or password. Try again or use “Forgot password”.');
      } else if (e?.code === 'UserNotFoundException') {
        setErr('No account found for that username/email.');
      } else if (e?.code === 'TooManyRequestsException') {
        setErr('Too many attempts. Please wait a few minutes and try again.');
      } else if (e?.code === 'PasswordResetRequiredException') {
        setErr('Password reset required. Use “Forgot password”.');
      } else {
        setErr(e?.message || e?.code || 'Sign-in failed.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  const completeNewPassword = async (e) => {
    e.preventDefault(); 
    setErr(''); 
    setMsg('');
    
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
    setErr(''); 
    setMsg('');
    
    const raw = (username || '').trim();
    if (!raw) return setErr('Enter your username or email.');
    const identifier = raw.includes('@') ? lc(raw) : raw;
    
    setLoading(true);
    try {
      await Auth.forgotPassword(identifier);
      setMsg('We sent a reset code to your email.'); 
      setMode('reset');
    } catch (e) {
      console.log('[Forgot error]', e);
      if (e?.code === 'UserNotFoundException') {
        setErr('No account found for that username/email.');
      } else if (e?.code === 'TooManyRequestsException') {
        setErr('Too many requests. Please wait a few minutes and try again.');
      } else {
        setErr(e?.message || e?.code || 'Could not start password reset.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  const forgotComplete = async (e) => {
    e.preventDefault(); 
    setErr(''); 
    setMsg('');
    
    const raw = (username || '').trim(); 
    const identifier = raw.includes('@') ? lc(raw) : raw;
    const resetCode = (code || '').trim();
    
    if (!identifier || !resetCode || !newPassword) {
      return setErr('Enter username/email, the 6-digit code, and a new password.');
    }
    
    setLoading(true);
    try {
      await Auth.forgotPasswordSubmit(identifier, resetCode, newPassword);
      setMsg('Password updated! You can sign in now.');
      setPassword('');
      setTimeout(() => setMode('signin'), 1500);
    } catch (e) {
      console.log('[Forgot submit error]', e);
      if (e?.code === 'CodeMismatchException') {
        setErr('Invalid code. Please check and try again.');
      } else if (e?.code === 'ExpiredCodeException') {
        setErr('Code expired. Click “Resend code”.');
      } else if (e?.code === 'InvalidPasswordException') {
        setErr('Password must meet complexity rules.');
      } else {
        setErr(e?.message || e?.code || 'Could not set new password.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  const resendCode = async () => {
    setErr(''); 
    setMsg(''); 
    const raw = (username || '').trim();
    if (!raw) return setErr('Enter your username or email first.');
    const identifier = raw.includes('@') ? lc(raw) : raw;

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
              <input 
                type="text" 
                value={username} 
                onChange={e=>setUsername(e.target.value)}
                placeholder="Username or Email"   // updated label
                autoComplete="username"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none focus:border-indigo-500 focus:bg-slate-800/70 transition-colors" 
                required 
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
            </div>
            <div className="relative">
              <input 
                type={showPwd?'text':'password'} 
                value={password} 
                onChange={e=>setPassword(e.target.value)}
                placeholder="Password" 
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none focus:border-indigo-500 focus:bg-slate-800/70 transition-colors" 
                required 
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
              <button type="button" className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-300" onClick={()=>setShowPwd(v=>!v)}>
                {showPwd ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-3 font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Sign in
            </button>
            <div className="text-center space-y-2">
              <button 
                type="button" 
                onClick={()=>{setErr('');setMsg('');setMode('forgot');}}
                className="text-indigo-300 hover:text-indigo-200 text-sm transition-colors"
              >
                Forgot password?
              </button>
              
              <div className="pt-4 border-t border-white/10">
                <p className="text-slate-400 text-sm mb-2">Don't have an account?</p>
                <button 
                  type="button" 
                  onClick={() => navigate('/register')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 font-medium text-slate-200 hover:text-white transition-colors"
                >
                  Create Account
                </button>
              </div>
              
              <div className="pt-2">
                <button 
                  type="button" 
                  onClick={() => navigate('/')}
                  className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
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
                placeholder="Username or Email"
                autoComplete="username"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none focus:border-indigo-500 focus:bg-slate-800/70 transition-colors" 
                required 
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-3 font-medium disabled:opacity-60 transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Send reset code
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={forgotComplete} className="space-y-4" noValidate>
            <div className="relative">
              <input 
                type="text" 
                value={code} 
                onChange={e=>setCode(e.target.value)}
                placeholder="6-digit code" 
                maxLength={6} 
                inputMode="numeric"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none tracking-widest focus:border-indigo-500 focus:bg-slate-800/70 transition-colors" 
                required 
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
            </div>
            <div className="relative">
              <input 
                type={showPwd?'text':'password'} 
                value={newPassword} 
                onChange={e=>setNewPassword(e.target.value)}
                placeholder="New password" 
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none focus:border-indigo-500 focus:bg-slate-800/70 transition-colors" 
                required 
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
              <button type="button" className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-300" onClick={()=>setShowPwd(v=>!v)}>
                {showPwd ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            <div className="text-xs text-slate-400 bg-slate-800/30 p-3 rounded-lg">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character.
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 px-4 py-3 font-medium disabled:opacity-60 transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Set new password
            </button>
            <div className="text-center">
              <button 
                type="button" 
                onClick={resendCode} 
                disabled={loading || !username}
                className="text-indigo-300 hover:text-indigo-200 text-sm disabled:opacity-50 transition-colors"
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
                type={showPwd?'text':'password'} 
                value={newPassword} 
                onChange={e=>setNewPassword(e.target.value)}
                placeholder="New password" 
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 outline-none focus:border-indigo-500 focus:bg-slate-800/70 transition-colors" 
                required 
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"/>
              <button type="button" className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-300" onClick={()=>setShowPwd(v=>!v)}>
                {showPwd ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 px-4 py-3 font-medium disabled:opacity-60 transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : null} Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
