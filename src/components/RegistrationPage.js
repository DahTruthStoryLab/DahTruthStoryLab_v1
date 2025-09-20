// src/components/RegistrationPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify'; // ✅ v5 import
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const sanitize = (s = '') => s.trim();
const stripSpaces = (s = '') => s.replace(/\s+/g, '');

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // 'register' | 'confirm'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: ''
  });
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    const email = stripSpaces(sanitize(formData.email));
    const username = stripSpaces(sanitize(formData.username));

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) newErrors.email = 'Email is required';
    else if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email address';

    if (!username) newErrors.username = 'Username is required';
    else if (username.length < 3) newErrors.username = 'Username must be at least 3 characters';

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password) newErrors.password = 'Password is required';
    else if (!passwordRegex.test(formData.password))
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (!sanitize(formData.firstName)) newErrors.firstName = 'First name is required';
    if (!sanitize(formData.lastName)) newErrors.lastName = 'Last name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const transformed =
      name === 'email' || name === 'username' ? stripSpaces(value) : value;
    setFormData(prev => ({ ...prev, [name]: transformed }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ---- v5 Auth: Sign Up ----
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');
    setErrors({});

    const email = stripSpaces(sanitize(formData.email)).toLowerCase();
    const username = stripSpaces(sanitize(formData.username));
    const given = sanitize(formData.firstName);
    const family = sanitize(formData.lastName);

    try {
      const { user } = await Auth.signUp({
        username,
        password: formData.password,
        attributes: {
          email,
          given_name: given,
          family_name: family,
        },
      });

      console.log('Registration successful:', user);
      setMessage('Registration successful! Please check your email for the confirmation code.');
      setStep('confirm');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors(prev => ({
        ...prev,
        general: (error && (error.message || error.code)) || 'Registration failed. Please try again.',
      }));
    } finally {
      setLoading(false);
    }
  };

  // ---- v5 Auth: Confirm Sign Up ----
  const handleConfirmation = async (e) => {
    e.preventDefault();
    const code = stripSpaces(sanitize(confirmationCode));
    if (!code) {
      setErrors(prev => ({ ...prev, confirmation: 'Please enter the confirmation code' }));
      return;
    }

    setLoading(true);
    setMessage('');
    setErrors({});

    const username = stripSpaces(sanitize(formData.username));

    try {
      await Auth.confirmSignUp(username, code);

      const userData = {
        firstName: sanitize(formData.firstName),
        lastName: sanitize(formData.lastName),
        username,
        email: stripSpaces(sanitize(formData.email)),
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));

      setMessage('Welcome to DahTruth Story Lab! Your writing journey begins now.');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Confirmation error:', error);
      setErrors(prev => ({
        ...prev,
        confirmation: (error && (error.message || error.code)) || 'Invalid confirmation code',
      }));
    } finally {
      setLoading(false);
    }
  };

  // ---- v5 Auth: Resend Code ----
  const handleResendCode = async () => {
    const username = stripSpaces(sanitize(formData.username));
    if (!username) {
      setErrors(prev => ({ ...prev, general: 'Username is required to resend code' }));
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await Auth.resendSignUp(username);
      setMessage('Confirmation code resent to your email.');
      setErrors({});
    } catch (error) {
      console.error('Resend error:', error);
      setErrors(prev => ({
        ...prev,
        general: (error && (error.message || error.code)) || 'Failed to resend code',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLanding = () => { navigate('/'); };

  // ---------- RENDER ----------
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 bg-blue-950/50 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-md border border-blue-800/40">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-2xl border-2 border-blue-400/30 mx-auto mb-6">
              <img src="/dahtruth-logo.png" alt="DahTruth Story Lab Logo" className="w-full h-full object-cover" />
            </div>
            <div className="bg-blue-600/30 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Mail className="h-10 w-10 text-blue-300" />
            </div>
            <h2 className="text-3xl font-bold text-white font-serif mb-3">Confirm Your Email</h2>
            <p className="text-blue-200 font-serif">
              We sent a confirmation code to <span className="font-medium text-white">{formData.email}</span>
            </p>
          </div>

          <form onSubmit={handleConfirmation} className="space-y-8" noValidate>
            <div>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(stripSpaces(e.target.value))}
                placeholder="Enter confirmation code"
                className="w-full px-6 py-4 bg-blue-900/30 border border-blue-700/50 rounded-xl text-center text-xl font-mono text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                required
              />
              {errors.confirmation && (
                <div className="flex items-center mt-2 text-red-300 text-sm font-serif">
                  <XCircle className="h-4 w-4 mr-1" />
                  {errors.confirmation}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 text-white py-4 px-6 rounded-xl font-serif font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {loading ? (<><Loader2 className="animate-spin h-6 w-6 mr-2" />Confirming...</>) : ('Confirm Email')}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || !formData.username}
                className="text-blue-300 hover:text-blue-100 font-serif text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </form>

          {message && (
            <div className="mt-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl flex items-center backdrop-blur-sm">
              <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
              <span className="text-green-100 text-sm font-serif">{message}</span>
            </div>
          )}

          {errors.general && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl flex items-center backdrop-blur-sm">
              <XCircle className="h-5 w-5 text-red-300 mr-2" />
              <span className="text-red-100 text-sm font-serif">{errors.general}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep('register')}
            className="w-full mt-6 text-blue-300 text-sm hover:text-blue-100 font-serif transition-colors"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
    );
  }

  // registration page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 bg-blue-950/50 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-lg border border-blue-800/40">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-2xl border-2 border-blue-400/30 mx-auto mb-6">
            <img src="/dahtruth-logo.png" alt="DahTruth Story Lab Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-4xl font-bold text-white font-serif mb-3">Join DahTruth Story Lab</h2>
          <p className="text-blue-200 font-serif text-lg">Begin your writing journey today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <LabeledInput
              icon={<User className="h-5 w-5" />}
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First Name"
              error={errors.firstName}
              required
            />
            <LabeledInput
              icon={<User className="h-5 w-5" />}
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name"
              error={errors.lastName}
              required
            />
          </div>

          <LabeledInput
            icon={<User className="h-5 w-5" />}
            name="username"
            value={formData.username}
            onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
            onChange={handleInputChange}
            placeholder="Username"
            error={errors.username}
            required
            autoComplete="username"
          />

          <LabeledInput
            icon={<Mail className="h-5 w-5" />}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email Address"
            error={errors.email}
            required
            autoComplete="email"
          />

          <PasswordInput
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Password"
            show={showPassword}
            setShow={setShowPassword}
            error={errors.password}
            autoComplete="new-password"
          />

          <PasswordInput
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm Password"
            show={showConfirmPassword}
            setShow={setShowConfirmPassword}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <div className="text-sm text-blue-200 bg-blue-900/30 p-4 rounded-xl font-serif backdrop-blur-sm">
            Password must contain at least 8 characters with uppercase, lowercase, number, and special character
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 text-white py-4 px-6 rounded-xl font-serif font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105"
          >
            {loading ? (<><Loader2 className="animate-spin h-6 w-6 mr-2" />Creating Account...</>) : ('Join the Story Lab')}
          </button>
        </form>

        {message && (
          <div className="mt-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl flex items-center backdrop-blur-sm">
            <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
            <span className="text-green-100 text-sm font-serif">{message}</span>
          </div>
        )}

        {errors.general && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl flex items-center backdrop-blur-sm">
            <XCircle className="h-5 w-5 text-red-300 mr-2" />
            <span className="text-red-100 text-sm font-serif">{errors.general}</span>
          </div>
        )}

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
          onClick={handleBackToLanding}
          className="w-full mt-4 text-blue-300 text-sm hover:text-blue-100 font-serif transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

// ---- Presentational inputs ----
function LabeledInput({
  icon, name, type = 'text', value, onChange, onKeyDown, placeholder, error, required, autoComplete
}) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <span className="text-blue-300 group-focus-within:text-blue-100 transition-colors">{icon}</span>
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onKeyDown={onKeyDown}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full pl-12 pr-4 py-4 bg-blue-900/30 border border-blue-700/50 rounded-xl 
          text-white placeholder-blue-300 backdrop-blur-sm
          focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-900/40
          transition-all duration-300 font-serif
          ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
        required={required}
      />
      {error && (
        <div className="flex items-center mt-2 text-red-300 text-sm font-serif">
          <XCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}

function PasswordInput({ name, value, onChange, placeholder, show, setShow, error, autoComplete }) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Lock className="h-5 w-5 text-blue-300 group-focus-within:text-blue-100 transition-colors" />
      </div>
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full pl-12 pr-12 py-4 bg-blue-900/30 border border-blue-700/50 rounded-xl 
          text-white placeholder-blue-300 backdrop-blur-sm
          focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-900/40
          transition-all duration-300 font-serif
          ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
        required
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-blue-100 transition-colors"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
      {error && (
        <div className="flex items-center mt-2 text-red-300 text-sm font-serif">
          <XCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}

export default RegistrationPage;
