import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authApi,
  studentApi,
  getToken,
  setToken,
  removeToken,
} from '../services/api';
import {
  auth,
  googleProvider,
  loginWithFirebaseEmail,
  registerWithFirebaseEmail,
  loginWithFirebaseGoogle,
  sendFirebasePasswordReset,
  logoutFirebase,
} from '../services/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize session from token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.success && res.data) {
          setUser(res.data.user);
          setStudent(res.data.student || null);
          setIsAuthenticated(true);
        } else {
          removeToken();
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        removeToken();
        setUser(null);
        setStudent(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for 401 session expiry events dispatched by API client
    const handleAuthExpired = () => {
      removeToken();
      setUser(null);
      setStudent(null);
      setIsAuthenticated(false);
      setAuthError('Your session has expired. Please sign in again.');
    };

    window.addEventListener('campushire:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('campushire:auth-expired', handleAuthExpired);
    };
  }, []);

  /**
   * Unified Login: tries Firebase first, falls back to direct API for demo credentials
   */
  const login = async (email, password) => {
    setAuthError(null);
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Firebase Authentication first
    try {
      const { idToken } = await loginWithFirebaseEmail(normalizedEmail, password);
      if (idToken) {
        // Sync Firebase identity with MongoDB User & Student records
        const syncRes = await authApi.firebaseSync({ idToken });
        if (syncRes.success && syncRes.data) {
          setToken(idToken);
          setUser(syncRes.data.user);
          setStudent(syncRes.data.student || null);
          setIsAuthenticated(true);
          return { success: true, user: syncRes.data.user };
        }
      }
    } catch (fbErr) {
      // If Firebase auth failed, fall back to backend database verification
      console.info('Firebase login fallback to backend auth:', fbErr.message);
    }

    // 2. Direct Express / MongoDB Auth fallback (demo accounts & pre-seeded users)
    try {
      const res = await authApi.login({
        email: normalizedEmail,
        password,
      });

      if (res.success && res.data?.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        setStudent(res.data.student || null);
        setIsAuthenticated(true);
        return { success: true, user: res.data.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Google Sign-In with Firebase
   */
  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const { user: fbUser, idToken } = await loginWithFirebaseGoogle();
      if (!idToken) throw new Error('Could not retrieve Google ID Token');

      const syncRes = await authApi.firebaseSync({
        idToken,
        name: fbUser.displayName || '',
      });

      if (syncRes.success && syncRes.data) {
        setToken(idToken);
        setUser(syncRes.data.user);
        setStudent(syncRes.data.student || null);
        setIsAuthenticated(true);
        return { success: true, user: syncRes.data.user };
      }
      throw new Error(syncRes.message || 'Google account sync failed');
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Student Registration: registers in Firebase and syncs to MongoDB
   */
  const register = async (registrationData) => {
    setAuthError(null);
    const { email, password, name, rollNumber, department, batchYear } = registrationData;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try registering with Firebase
    try {
      const { idToken } = await registerWithFirebaseEmail(normalizedEmail, password);
      if (idToken) {
        const syncRes = await authApi.firebaseSync({
          idToken,
          name,
          rollNumber,
          department,
          batchYear,
        });

        if (syncRes.success && syncRes.data) {
          setToken(idToken);
          setUser(syncRes.data.user);
          setStudent(syncRes.data.student || null);
          setIsAuthenticated(true);
          return { success: true, user: syncRes.data.user };
        }
      }
    } catch (fbErr) {
      console.info('Firebase register fallback to backend:', fbErr.message);
    }

    // 2. Direct Backend registration fallback
    try {
      const res = await authApi.register(registrationData);
      if (res.success && res.data?.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        setStudent(res.data.student || null);
        setIsAuthenticated(true);
        return { success: true, user: res.data.user };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Password Reset via Firebase
   */
  const resetPassword = async (email) => {
    setAuthError(null);
    try {
      await sendFirebasePasswordReset(email.trim().toLowerCase());
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Log out and clear session across Firebase and LocalStorage
   */
  const logout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      // Ignore logout errors
    }
    removeToken();
    setUser(null);
    setStudent(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  /**
   * Refresh current user and student profile from backend
   */
  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data.user);
        setStudent(res.data.student || null);
      }
    } catch (err) {
      console.warn('Could not refresh user session:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        student,
        isAuthenticated,
        loading,
        authError,
        setAuthError,
        login,
        loginWithGoogle,
        register,
        resetPassword,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
