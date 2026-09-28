import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Building2,
  DollarSign,
  PieChart,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { analyticsApi } from '../../services/api';

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState(null);
  const [branches, setBranches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, branchRes, compRes] = await Promise.allSettled([
        analyticsApi.getOverview(),
        analyticsApi.getBranches(),
        analyticsApi.getCompanies(),
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value.success) {
        setOverview(overviewRes.value.data);
      }
      if (branchRes.status === 'fulfilled' && branchRes.value.success) {
        setBranches(branchRes.value.data?.branches || branchRes.value.data || []);
      }
      if (compRes.status === 'fulfilled' && compRes.value.success) {
        setCompanies(compRes.value.data?.companies || compRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Unable to load analytics metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            University Placement Analytics & KPIs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Branch-wise placement progression, compensation metrics, and corporate engagement reports
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAnalytics} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Placed"
          value={overview?.selectedStudents ?? (loading ? '...' : 0)}
          subtitle={`${overview?.placementRate ?? 0}% Overall Placement`}
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Total Candidates"
          value={overview?.totalStudents ?? (loading ? '...' : 0)}
          subtitle={`${overview?.registeredStudents ?? 0} Registered`}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Total Applications"
          value={overview?.totalApplications ?? (loading ? '...' : 0)}
          subtitle={`${overview?.shortlistedStudents ?? 0} Shortlisted`}
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Active Recruiters"
          value={overview?.totalCompanies ?? (loading ? '...' : 0)}
          subtitle={`${overview?.activeRecruitmentDrives ?? 0} Active Drives`}
          icon={Building2}
          color="blue"
        />
      </div>

      {/* Branch-Wise Placement Counts Chart Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Branch-Wise Placement Performance</h3>
            <p className="text-xs text-slate-500">Placement conversion ratios across academic engineering departments</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            Batch 2026
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading branch progression...</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No branch placement data available yet.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {branches.map((b) => {
              const deptName = b.branch || b.department || 'General';
              const placed = b.placedStudents ?? b.placed ?? 0;
              const total = b.totalStudents ?? b.total ?? 0;
              const rate = b.placementRate ?? (total > 0 ? Number(((placed / total) * 100).toFixed(1)) : 0);
              const avg = b.averagePackage ?? 0;
              const max = b.highestPackage ?? 0;

              return (
                <div key={deptName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 w-16">{deptName}</span>
                    <span className="text-slate-500">
                      <span className="font-bold text-slate-800">{placed}</span> of {total} placed
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 w-14 text-right">
                      {rate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, rate)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Avg: ₹ {avg} LPA</span>
                    <span>Max: ₹ {max} LPA</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Company Recruitment Engagement Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Company-Wise Application & Selection Volume</h3>
            <p className="text-xs text-slate-500">Applicant conversions and hiring yields per enterprise partner</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading company stats...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No company recruitment statistics available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">Company Name</th>
                  <th className="py-2.5">CTC Tier</th>
                  <th className="py-2.5">Applications</th>
                  <th className="py-2.5">Shortlisted</th>
                  <th className="py-2.5">Final Selections</th>
                  <th className="py-2.5">Conversion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {companies.map((c) => {
                  const compName = c.companyName || c.name || 'Partner Company';
                  const apps = c.totalApplications ?? c.applications ?? 0;
                  const shortlisted = c.shortlistedStudents ?? c.shortlisted ?? 0;
                  const selected = c.selectedStudents ?? c.selected ?? 0;
                  const conv = apps > 0 ? ((selected / apps) * 100).toFixed(1) : 0;
                  const tier = c.tier || 'Normal';

                  return (
                    <tr key={compName} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-900">{compName}</td>
                      <td className="py-3">
                        <Badge variant={tier}>{tier}</Badge>
                      </td>
                      <td className="py-3 font-semibold text-slate-800">{apps}</td>
                      <td className="py-3 text-indigo-600 font-medium">{shortlisted}</td>
                      <td className="py-3 font-bold text-emerald-600">{selected}</td>
                      <td className="py-3 font-bold text-slate-900">{conv}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
