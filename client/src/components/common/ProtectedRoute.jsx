import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute component guarding routes based on authentication and RBAC roles
 */
export default function ProtectedRoute({ allowedRoles = null }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions if specified
  if (allowedRoles && user && !allowedRoles.includes(user.role?.toLowerCase())) {
    // If student attempts to access admin route, redirect to student dashboard
    if (user.role?.toLowerCase() === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    // If admin attempts to access student-only route, redirect to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
