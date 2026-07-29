import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { api } from '../services/api';
import { auth, googleProvider } from '../services/firebase';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const GoogleMark: React.FC = () => (
  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.51h3.24c1.9-1.75 2.81-4.33 2.81-7.28Z"
    />
    <path
      fill="#34A853"
      d="M12 21.75c2.63 0 4.84-.87 6.45-2.36L15.21 16.9c-.9.6-2.05.96-3.21.96-2.53 0-4.68-1.71-5.45-4.01H3.2v2.59A9.74 9.74 0 0 0 12 21.75Z"
    />
    <path
      fill="#FBBC05"
      d="M6.55 13.85A5.85 5.85 0 0 1 6.25 12c0-.64.11-1.26.3-1.85V7.56H3.2A9.75 9.75 0 0 0 2.25 12c0 1.58.38 3.08.95 4.44l3.35-2.59Z"
    />
    <path
      fill="#EA4335"
      d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.22 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.8 5.31l3.35 2.59C7.32 7.85 9.47 6.14 12 6.14Z"
    />
  </svg>
);

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();
      const loginData = await api.googleLogin(idToken);

      if (!loginData.user) {
        throw new Error('Google sign-in did not return a user session');
      }

      onSuccess(loginData.user);
      onClose();
    } catch (signInError: unknown) {
      const firebaseError = signInError as { code?: string };
      setError(
        firebaseError.code === 'auth/popup-closed-by-user'
          ? 'Google sign-in was cancelled.'
          : getErrorMessage(signInError, 'Google sign-in failed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Name is required');
        if (!email.trim() || !email.includes('@')) throw new Error('Valid email required');
        if (password.length < 8) throw new Error('Password must be at least 8 characters long');

        await api.register(name, email, password);
        setSuccessMsg('Account registered successfully! Logging you in...');

        const loginData = await api.login(email, password);
        if (!loginData.user) {
          throw new Error('Login did not return a user session');
        }

        onSuccess(loginData.user);
        onClose();
        return;
      }

      if (!email.trim() || !password) throw new Error('Email and password are required');
      const loginData = await api.login(email, password);
      if (!loginData.user) {
        throw new Error('Login did not return a user session');
      }

      onSuccess(loginData.user);
      onClose();
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setName('John Doe');
    setEmail('john@example.com');
    setPassword('Password123!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <button
          id="close-auth-modal"
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          aria-label="Close authentication dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-800/60 bg-indigo-950/80 text-indigo-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Secure sign-in for your resume analysis workspace
          </p>
        </div>

        <button
          id="auth-google-login-btn"
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center space-x-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          ) : (
            <GoogleMark />
          )}
          <span>Continue with Google</span>
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          <span className="h-px flex-1 bg-slate-800" />
          <span>or continue with email</span>
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="mb-6 flex rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            id="switch-to-login-tab"
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            disabled={loading}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'login' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Login
          </button>
          <button
            id="switch-to-register-tab"
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            disabled={loading}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'register' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Register
          </button>
        </div>

        <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
          <span className="font-medium text-slate-400">Need test credentials?</span>
          <button
            id="demo-credentials-fill-btn"
            type="button"
            onClick={handleDemoFill}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Auto-fill Demo
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start space-x-2 rounded-xl border border-rose-800/80 bg-rose-950/80 p-3 text-xs font-medium text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start space-x-2 rounded-xl border border-emerald-800/80 bg-emerald-950/80 p-3 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300" htmlFor="auth-name-input">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="auth-name-input"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300" htmlFor="auth-email-input">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300" htmlFor="auth-password-input">
              Password {mode === 'register' && '(min 8 characters)'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                id="auth-password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center space-x-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Login with Email' : 'Register Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
