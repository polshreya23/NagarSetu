import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  User,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from '../firebase.ts';
import { User as UserType } from '../types/index.ts';

interface AuthScreenProps {
  onLoginSuccess: (user: UserType) => void;
  onDemoLogin: (email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onDemoLogin,
}) => {
  // Mode: 'options' | 'email-login' | 'email-register' | 'phone-otp' | 'forgot-password'
  const [authMode, setAuthMode] = useState<
    'options' | 'email-login' | 'email-register' | 'phone-otp' | 'forgot-password'
  >('options');

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Phone Auth State
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpSent, countdown]);

  // Clean error message on mode switch
  const switchMode = (mode: typeof authMode) => {
    setAuthMode(mode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // 1. REAL GOOGLE AUTHENTICATION
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      if (!fbUser.email) {
        throw new Error('Google account did not provide an email address.');
      }

      // Sync with backend database
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fbUser.email,
          name: fbUser.displayName || 'Citizen',
          photoUrl: fbUser.photoURL || undefined,
          uid: fbUser.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate Google user with server.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. Please click "Continue with Google" to retry.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setErrorMsg('Authentication request cancelled. Please try again.');
      } else {
        setErrorMsg(err.message || 'Google authentication failed. Please try again or use another login method.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. REAL MOBILE OTP AUTHENTICATION
  const initRecaptcha = () => {
    if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setErrorMsg('reCAPTCHA expired. Please try sending OTP again.');
          },
        });
      } catch (err) {
        console.warn('reCAPTCHA init error:', err);
      }
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (countryCode === '+91' && cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (cleanPhone.length < 8) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }

    setLoading(true);
    const fullPhoneNumber = `${countryCode}${cleanPhone}`;

    try {
      initRecaptcha();
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA could not be initialized.');
      }

      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setCountdown(60);
      setSuccessMsg(`OTP sent successfully to ${fullPhoneNumber}`);
    } catch (err: any) {
      console.error('Phone OTP Send Error:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setErrorMsg('Invalid mobile phone number format. Please check the digits.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Too many OTP attempts from this number. Please wait a few minutes before retrying.');
      } else if (err.code === 'auth/quota-exceeded') {
        setErrorMsg('SMS quota limit reached. Please use Google Login or Email/Password.');
      } else {
        // Fallback for demonstration if Firebase SMS is unconfigured or blocked by adblock
        setErrorMsg(
          err.message ||
            'Could not dispatch SMS. Ensure Phone provider is enabled in Firebase Console, or test via Email/Google login.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit OTP code.');
      return;
    }

    if (!confirmationResult) {
      setErrorMsg('Session expired. Please request a new OTP code.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(cleanOtp);
      const fbUser = userCredential.user;

      const fullPhoneNumber = `${countryCode}${phone.replace(/[^0-9]/g, '')}`;

      // Sync phone user to database (assigned CITIZEN role)
      const res = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhoneNumber,
          name: name.trim() || undefined,
          uid: fbUser.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate mobile user.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setErrorMsg('Invalid OTP code. Please verify the 6 digits and try again.');
      } else if (err.code === 'auth/code-expired') {
        setErrorMsg('The OTP code has expired. Please request a fresh OTP.');
      } else {
        setErrorMsg(err.message || 'OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. EMAIL & PASSWORD LOGIN
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      // First attempt Firebase auth if user exists there
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (fbErr: any) {
        // If not in Firebase yet, fall through to server database check
        console.log('Firebase signIn info:', fbErr.code);
      }

      // Check server database
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // 4. CITIZEN REGISTRATION
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      // Create user in Firebase Auth
      try {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } catch (fbErr: any) {
        console.warn('Firebase createUser info:', fbErr.message);
      }

      // Register citizen in server database (strictly CITIZEN role)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          ward: 'Pune Central',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create citizen account.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Please log in.');
      } else {
        setErrorMsg(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 5. FORGOT PASSWORD
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg(`Password reset instructions have been dispatched to ${email.trim()}.`);
    } catch (err: any) {
      console.warn('Password reset error:', err);
      setSuccessMsg(`If an account exists for ${email.trim()}, password reset instructions have been initiated.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-white font-['Plus_Jakarta_Sans']">
      {/* Invisible reCAPTCHA container for Phone Auth */}
      <div ref={recaptchaContainerRef} id="recaptcha-container"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 border border-blue-400/40">
            <Building2 className="w-8 h-8 text-white" />
          </div>

          <div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Nagar<span className="text-blue-400">Setu</span>
              </span>
              <span className="text-[10px] bg-blue-900/80 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded font-mono">
                PUNE
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
              Report • Detect • Prioritize • Resolve
            </p>
          </div>

          <h2 className="text-lg font-bold text-slate-100 pt-1">
            Welcome to NagarSetu
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            AI-powered smart civic reporting and grievance management platform for Pune urban area.
          </p>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* MAIN VIEW: AUTHENTICATION OPTIONS */}
        {authMode === 'options' && (
          <div className="space-y-4">
            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-3 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
            </button>

            {/* Mobile OTP Button */}
            <button
              type="button"
              onClick={() => switchMode('phone-otp')}
              className="w-full bg-slate-800 hover:bg-slate-700/80 text-white font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Continue with Mobile Number</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Or with Email
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Email Login Button */}
            <button
              type="button"
              onClick={() => switchMode('email-login')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Sign In with Email & Password</span>
            </button>

            {/* Register link */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                New citizen to Pune civic portal?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('email-register')}
                  className="text-blue-400 hover:underline font-bold"
                >
                  Register Account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* VIEW: EMAIL LOGIN */}
        {authMode === 'email-login' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password')}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => switchMode('options')}
                className="hover:text-white"
              >
                ← Other sign in options
              </button>
              <button
                type="button"
                onClick={() => switchMode('email-register')}
                className="text-blue-400 hover:underline font-bold"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* VIEW: CITIZEN REGISTRATION */}
        {authMode === 'email-register' && (
          <form onSubmit={handleEmailRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mobile Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="+91 98901 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Create Password (Min 6 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Public registration assigns default CITIZEN privileges.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{loading ? 'Creating Account...' : 'Complete Citizen Registration'}</span>
            </button>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => switchMode('options')}
                className="hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => switchMode('email-login')}
                className="text-blue-400 hover:underline font-bold"
              >
                Already have account? Sign in
              </button>
            </div>
          </form>
        )}

        {/* VIEW: MOBILE NUMBER + OTP */}
        {authMode === 'phone-otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Country & Enter Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl text-xs px-2.5 py-2.5 text-white"
                    >
                      <option value="+91">🇮🇳 India (+91)</option>
                      <option value="+1">🇺🇸 USA (+1)</option>
                      <option value="+44">🇬🇧 UK (+44)</option>
                      <option value="+971">🇦🇪 UAE (+971)</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="98901 00000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    We will send a 6-digit OTP SMS via Firebase Phone Authentication.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name (Optional for first-time login)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Joshi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>{loading ? 'Sending OTP SMS...' : 'Send OTP Code'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Enter 6-Digit OTP Code
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Sent to {countryCode} {phone}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Change number
                  </button>

                  {countdown > 0 ? (
                    <span className="text-slate-500 text-[11px]">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-blue-400 hover:underline font-semibold text-[11px]"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{loading ? 'Verifying OTP...' : 'Verify & Enter Portal'}</span>
                </button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => switchMode('options')}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Back to all login methods
              </button>
            </div>
          </div>
        )}

        {/* VIEW: FORGOT PASSWORD */}
        {authMode === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Registered Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Send Password Reset Link</span>
            </button>

            <div className="text-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => switchMode('email-login')}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* PRE-CONFIGURED DEMO SHORTCUTS SECTION */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Quick Demo Verification Access:</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => onDemoLogin('shreya.1251070104@vit.edu')}
              className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-700/60 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-1 font-bold text-purple-300 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Shreya Pol</span>
              </div>
              <div className="text-[10px] text-purple-200/80 font-mono">Super Administrator</div>
            </button>

            <button
              type="button"
              onClick={() => onDemoLogin('aarav.sharma@example.com')}
              className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-700/60 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-1 font-bold text-emerald-300 text-[11px]">
                <User className="w-3.5 h-3.5" />
                <span>Aarav Sharma</span>
              </div>
              <div className="text-[10px] text-emerald-200/80 font-mono">Citizen (Shivajinagar)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
