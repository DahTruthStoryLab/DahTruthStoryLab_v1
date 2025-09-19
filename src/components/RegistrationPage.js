import React, { useState, useCallback } from 'react';
import { Auth } from 'aws-amplify';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Move InputField outside of component to prevent recreation
const InputField = ({ type, name, placeholder, value, icon: Icon, showToggle = false, showValue = false, onChange, errors, onToggleShow }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-blue-300 group-focus-within:text-blue-100 transition-colors" />
    </div>
    <input
      type={showToggle ? (showValue ? 'text' : 'password') : type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full pl-12 pr-12 py-4 bg-blue-900/30 border border-blue-700/50 rounded-xl 
        text-white placeholder-blue-300 backdrop-blur-sm
        focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-900/40
        transition-all duration-300 font-serif
        ${errors[name] ? 'border-red-400 focus:ring-red-400' : ''}`}
    />
    {showToggle && (
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-blue-100 transition-colors"
        onClick={() => onToggleShow(name)}
      >
        {showValue ? 
          <EyeOff className="h-5 w-5" /> : 
          <Eye className="h-5 w-5" />
        }
      </button>
    )}
    {errors[name] && (
      <div className="flex items-center mt-2 text-red-300 text-sm font-serif">
        <XCircle className="h-4 w-4 mr-1" />
        {errors[name]}
      </div>
    )}
  </div>
);

const RegistrationPage = () => {
  const [step, setStep] = useState('register'); // 'register' or 'confirm'
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
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Use useCallback to prevent function recreation
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    setErrors(prev => {
      if (prev[name]) {
        return {
          ...prev,
          [name]: ''
        };
      }
      return prev;
    });
  }, []);

  // Handle password visibility toggle
  const handleToggleShow = useCallback((name) => {
    if (name === 'password') {
      setShowPassword(prev => !prev);
    } else if (name === 'confirmPassword') {
      setShowConfirmPassword(prev => !prev);
    }
  }, []);

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { user } = await Auth.signUp({
        username: formData.email,
        password: formData.password,
        attributes: {
          email: formData.email,
          given_name: formData.firstName,
          family_name: formData.lastName,
          preferred_username: formData.username
        }
      });

      console.log('Registration successful:', user);
      setMessage('Registration successful! Please check your email for confirmation code.');
      setStep('confirm');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: error.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async () => {
    if (!confirmationCode.trim()) {
      setErrors({ confirmation: 'Please enter the confirmation code' });
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await Auth.confirmSignUp(formData.email, confirmationCode.trim());
      setMessage('Welcome to DahTruth Story Lab! Your writing journey begins now.');
      // Redirect to dashboard or login
      setTimeout(() => {
        window.location.href = '/dashboard'; // or wherever you want them to go
      }, 2000);
    } catch (error) {
      console.error('Confirmation error:', error);
      setErrors({ confirmation: error.message || 'Invalid confirmation code' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await Auth.resendSignUp(formData.email);
      setMessage('Confirmation code resent to your email.');
    } catch (error) {
      console.error('Resend error:', error);
      setErrors({ general: error.message || 'Failed to resend code' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLanding = () => {
    window.location.href = '/';
  };

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 bg-blue-950/50 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-md border border-blue-800/40">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-2xl border-2 border-blue-400/30 mx-auto mb-6">
              <img 
                src="/dahtruth-logo.png" 
                alt="DahTruth Story Lab Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-blue-600/30 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Mail className="h-10 w-10 text-blue-300" />
            </div>
            <h2 className="text-3xl font-bold text-white font-serif mb-3">Confirm Your Email</h2>
            <p className="text-blue-200 font-serif">
              We sent a confirmation code to <span className="font-medium text-white">{formData.email}</span>
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Enter confirmation code"
                className="w-full px-6 py-4 bg-blue-900/30 border border-blue-700/50 rounded-xl text-center text-xl font-mono tracking-widest text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                maxLength={6}
              />
              {errors.confirmation && (
                <div className="flex items-center mt-2 text-red-300 text-sm font-serif">
                  <XCircle className="h-4 w-4 mr-1" />
                  {errors.confirmation}
                </div>
              )}
            </div>

            <button
              onClick={handleConfirmation}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 text-white py-4 px-6 rounded-xl font-serif font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-6 w-6 mr-2" />
                  Confirming...
                </>
              ) : (
                'Confirm Email'
              )}
            </button>

            <div className="text-center">
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="text-blue-300 hover:text-blue-100 font-serif text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </div>

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
            onClick={() => setStep('register')} 
            className="w-full mt-6 text-blue-300 text-sm hover:text-blue-100 font-serif transition-colors"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 bg-blue-950/50 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-lg border border-blue-800/40">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-2xl border-2 border-blue-400/30 mx-auto mb-6">
            <img 
              src="/dahtruth-logo.png" 
              alt="DahTruth Story Lab Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-4xl font-bold text-white font-serif mb-3">Join DahTruth Story Lab</h2>
          <p className="text-blue-200 font-serif text-lg">Begin your writing journey today</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              icon={User}
              onChange={handleInputChange}
              errors={errors}
            />
            <InputField
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              icon={User}
              onChange={handleInputChange}
              errors={errors}
            />
          </div>

          <InputField
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            icon={User}
            onChange={handleInputChange}
            errors={errors}
          />

          <InputField
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            icon={Mail}
            onChange={handleInputChange}
            errors={errors}
          />

          <InputField
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            icon={Lock}
            showToggle={true}
            showValue={showPassword}
            onChange={handleInputChange}
            errors={errors}
            onToggleShow={handleToggleShow}
          />

          <InputField
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            icon={Lock}
            showToggle={true}
            showValue={showConfirmPassword}
            onChange={handleInputChange}
            errors={errors}
            onToggleShow={handleToggleShow}
          />

          <div className="text-sm text-blue-200 bg-blue-900/30 p-4 rounded-xl font-serif backdrop-blur-sm">
            Password must contain at least 8 characters with uppercase, lowercase, number, and special character
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 text-white py-4 px-6 rounded-xl font-serif font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-6 w-6 mr-2" />
                Creating Account...
              </>
            ) : (
              'Join the Story Lab'
            )}
          </button>
        </div>

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
            <button className="text-blue-300 hover:text-blue-100 font-medium transition-colors">
              Sign in
            </button>
          </p>
        </div>
        
        <button 
          onClick={handleBackToLanding} 
          className="w-full mt-4 text-blue-300 text-sm hover:text-blue-100 font-serif transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default RegistrationPage;
