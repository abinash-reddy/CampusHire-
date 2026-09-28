import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  FileCheck2,
  Calendar,
  Award,
  Bell,
  Megaphone,
  Users,
  Building2,
  CheckCircle,
  BarChart3,
  X,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  const studentNavItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/student/profile', icon: User },
    { name: 'Recruitment Drives', path: '/student/drives', icon: Briefcase },
    { name: 'My Applications', path: '/student/applications', icon: Compass },
    { name: 'Resume Upload', path: '/student/resume/upload', icon: FileText },
    { name: 'Resume ATS Testing', path: '/student/resume/test', icon: FileCheck2 },
    { name: 'Resume Job Match', path: '/student/resume/match', icon: Compass },
    { name: 'Interview Schedule', path: '/student/interviews', icon: Calendar },
    { name: 'Placement History', path: '/student/history', icon: Award },
    { name: 'Placement Updates', path: '/updates', icon: Megaphone },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const adminNavItems = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Student Management', path: '/admin/students', icon: Users },
    { name: 'Company Management', path: '/admin/companies', icon: Building2 },
    { name: 'Drive Management', path: '/admin/drives', icon: Briefcase },
    { name: 'Application Pipeline', path: '/admin/applications', icon: Compass },
    { name: 'Interview Schedules', path: '/admin/interviews', icon: Calendar },
    { name: 'Placement Results', path: '/admin/results', icon: CheckCircle },
    { name: 'Placement Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Placement Bulletin', path: '/updates', icon: Megaphone },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const isAdmin = user?.role === 'admin' || user?.role === 'tpo';
  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-200/80 bg-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div>
          {/* Mobile Header Close */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
            <span className="text-sm font-bold text-slate-800">Navigation</span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Role Tag */}
          <div className="px-5 pt-5 pb-3">
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Workspace
              </p>
              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                {isAdmin ? 'TPO Administration' : 'Student Portal'}
              </p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="px-3 py-2 space-y-1 max-h-[calc(100vh-170px)] overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] text-slate-400 text-center">
            CampusHire BTWA v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
