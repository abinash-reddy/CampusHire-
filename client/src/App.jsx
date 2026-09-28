import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout & Route Guards
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Shared Pages
import PlacementUpdates from './pages/shared/PlacementUpdates';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import RecruitmentDrives from './pages/student/RecruitmentDrives';
import DriveDetails from './pages/student/DriveDetails';
import EligibilityResult from './pages/student/EligibilityResult';
import ApplicationTracking from './pages/student/ApplicationTracking';
import ResumeUpload from './pages/student/ResumeUpload';
import ResumeTesting from './pages/student/ResumeTesting';
import ResumeMatchResults from './pages/student/ResumeMatchResults';
import InterviewSchedule from './pages/student/InterviewSchedule';
import Notifications from './pages/student/Notifications';
import PlacementHistory from './pages/student/PlacementHistory';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import CompanyManagement from './pages/admin/CompanyManagement';
import DriveManagement from './pages/admin/DriveManagement';
import ApplicationManagement from './pages/admin/ApplicationManagement';
import InterviewManagement from './pages/admin/InterviewManagement';
import ResultsManagement from './pages/admin/ResultsManagement';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';

// Helper component to redirect root "/" based on authenticated user's role
function RoleBasedRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading CampusHire...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin' || user?.role === 'tpo') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root redirect */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Shared Circulars & Notifications */}
              <Route path="/updates" element={<PlacementUpdates />} />
              <Route path="/notifications" element={<Notifications />} />

              {/* Student Portal Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/profile" element={<StudentProfile />} />
                <Route path="/student/drives" element={<RecruitmentDrives />} />
                <Route path="/student/drives/:id" element={<DriveDetails />} />
                <Route path="/student/drives/:driveId/eligibility" element={<EligibilityResult />} />
                <Route path="/student/applications" element={<ApplicationTracking />} />
                <Route path="/student/resume/upload" element={<ResumeUpload />} />
                <Route path="/student/resume/test" element={<ResumeTesting />} />
                <Route path="/student/resume/match" element={<ResumeMatchResults />} />
                <Route path="/student/interviews" element={<InterviewSchedule />} />
                <Route path="/student/history" element={<PlacementHistory />} />
              </Route>

              {/* Admin / TPO Management Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'tpo']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/students" element={<StudentManagement />} />
                <Route path="/admin/companies" element={<CompanyManagement />} />
                <Route path="/admin/drives" element={<DriveManagement />} />
                <Route path="/admin/applications" element={<ApplicationManagement />} />
                <Route path="/admin/interviews" element={<InterviewManagement />} />
                <Route path="/admin/results" element={<ResultsManagement />} />
                <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
