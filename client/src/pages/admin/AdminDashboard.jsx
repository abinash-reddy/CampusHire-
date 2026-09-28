import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Briefcase,
  Compass,
  Award,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  CheckCircle,
  BarChart3,
  Megaphone,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { analyticsApi, drivesApi } from '../../services/api';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [recentDrives, setRecentDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, drivesRes] = await Promise.allSettled([
        analyticsApi.getOverview(),
        drivesApi.getAll({ limit: 5 }),
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value.success) {
        setOverview(overviewRes.value.data);
      }
      if (drivesRes.status === 'fulfilled' && drivesRes.value.success) {
        setRecentDrives(drivesRes.value.data?.drives || drivesRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setError(err.message || 'Failed to load dashboard overview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Welcome Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30">
            TPO Central Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            Training & Placement Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Monitor real-time candidate applications, manage corporate recruitment drives, schedule interviews, and publish placement circulars.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchDashboardData} loading={loading} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            Refresh
          </Button>
          <Link to="/admin/drives">
            <Button variant="primary" size="sm" icon={Plus}>
              New Recruitment Drive
            </Button>
          </Link>
          <Link to="/admin/analytics">
            <Button variant="outline" size="sm" icon={BarChart3} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              View Analytics
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Students"
          value={overview?.totalStudents ?? (loading ? '...' : 0)}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Companies"
          value={overview?.totalCompanies ?? (loading ? '...' : 0)}
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="Active Drives"
          value={overview?.activeRecruitmentDrives ?? (loading ? '...' : 0)}
          icon={Briefcase}
          color="blue"
        />
        <StatCard
          title="Applications"
          value={overview?.totalApplications ?? (loading ? '...' : 0)}
          icon={Compass}
          color="cyan"
        />
        <StatCard
          title="Selected"
          value={overview?.selectedStudents ?? (loading ? '...' : 0)}
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Placement Rate"
          value={overview ? `${overview.placementRate}%` : (loading ? '...' : '0%')}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Administrative Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/admin/students">
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 transition-all flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Manage Students</p>
                <p className="text-[10px] text-slate-400">Profiles & verification</p>
              </div>
            </div>
          </Link>

          <Link to="/admin/companies">
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 transition-all flex items-center gap-3">
              <Building2 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Partner Companies</p>
                <p className="text-[10px] text-slate-400">Tier & recruiters</p>
              </div>
            </div>
          </Link>

          <Link to="/admin/results">
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 transition-all flex items-center gap-3">
              <Award className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Publish Results</p>
                <p className="text-[10px] text-slate-400">Selections & offers</p>
              </div>
            </div>
          </Link>

          <Link to="/updates">
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 transition-all flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Post Notice</p>
                <p className="text-[10px] text-slate-400">Campus bulletins</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Recruitment Drives Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Recruitment Drives</h3>
            <p className="text-xs text-slate-500">Recently scheduled drives and candidate participation</p>
          </div>
          <Link to="/admin/drives" className="text-xs font-semibold text-indigo-600 hover:underline">
            Manage All Drives
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading drives...</p>
          </div>
        ) : recentDrives.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No recruitment drives found. Click "New Recruitment Drive" to schedule one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentDrives.map((d) => {
              const compName = d.company?.name || d.company || 'Hiring Partner';
              const roleTitle = d.jobTitle || d.jobRole || 'Engineer';
              const pkg = d.ctcPackage || d.package || 'N/A';

              return (
                <div key={d._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{compName}</h4>
                      <p className="text-xs text-slate-500">{roleTitle} • ₹ {pkg} LPA</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <Badge variant={d.status}>{d.status}</Badge>
                    <Link to={`/admin/applications`}>
                      <Button variant="outline" size="sm">
                        View Applicants
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
