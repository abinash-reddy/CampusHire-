import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Shield,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export default function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login, loginWithGoogle, resetPassword, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleTabChange = (newRole) => {
    setRole(newRole);
    setErrorMessage('');
    setResetSuccess('');
    if (setAuthError) setAuthError(null);
  };

  const handleFillDemo = (demoRole) => {
    setRole(demoRole);
    if (demoRole === 'admin') {
      setEmail('admin@campushire.edu');
      setPassword('Admin@123');
    } else {
      setEmail('student@campushire.edu');
      setPassword('Student@123');
    }
    setErrorMessage('');
    setResetSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email address and password');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setResetSuccess('');

    try {
      const res = await login(email, password);
      const redirectPath =
        location.state?.from?.pathname ||
        (res.user?.role === 'admin' || res.user?.role === 'tpo'
          ? '/admin/dashboard'
          : '/student/dashboard');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage('');
    try {
      const res = await loginWithGoogle();
      const redirectPath =
        location.state?.from?.pathname ||
        (res.user?.role === 'admin' || res.user?.role === 'tpo'
          ? '/admin/dashboard'
          : '/student/dashboard');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    setErrorMessage('');
    try {
      await resetPassword(resetEmail);
      setResetSuccess(`Password reset email sent to ${resetEmail}. Check your inbox.`);
      setShowResetModal(false);
      setResetEmail('');
    } catch (err) {
      setErrorMessage(err.message || 'Could not send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Campus<span className="text-indigo-600">Hire</span> Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          College Placement & Recruitment Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 sm:px-10">
          {/* Role Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => handleRoleTabChange('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'student'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'admin'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin / TPO</span>
            </button>
          </div>

          {/* Success Banner */}
          {resetSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {(errorMessage || authError) && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Email Address
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'student' ? 'student@college.edu' : 'admin@college.edu'}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full mt-2"
            >
              Sign In as {role === 'admin' ? 'TPO Officer' : 'Student'}
            </Button>
          </form>

          {/* Optional Google Sign-In */}
          <div className="mt-4">
            <div className="relative flex py-2 items-center">
              <div className="grow border-t border-slate-200"></div>
              <span className="shrink mx-3 text-[11px] text-slate-400 uppercase tracking-wider">or</span>
              <div className="grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2 px-4 border border-slate-200 rounded-lg shadow-2xs bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Quick Demo Credentials Filler */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] text-center text-slate-400 font-medium mb-2.5">
              Fill Demo Credentials:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('student')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-indigo-200 bg-indigo-50/50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Fill Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-purple-200 bg-purple-50/50 text-purple-700 text-xs font-medium hover:bg-purple-100 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Fill Admin</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              New student?{' '}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Create your student account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
            <p className="text-xs text-slate-500">
              Enter your registered college email and we will send a password reset link to your inbox.
            </p>
            <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={resetLoading}
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
