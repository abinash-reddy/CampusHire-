import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Compass,
  Calendar,
  Award,
  FileCheck2,
  ArrowRight,
  Building2,
  Clock,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  studentApi,
  drivesApi,
  applicationsApi,
  interviewsApi,
} from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, drivesRes, appsRes, interviewsRes] = await Promise.allSettled([
          studentApi.getProfile(),
          drivesApi.getAll({ limit: 4, status: 'OPEN' }),
          applicationsApi.getMy(),
          interviewsApi.getMy(),
        ]);

        if (!isMounted) return;

        if (profileRes.status === 'fulfilled' && profileRes.value.success) {
          setProfile(profileRes.value.data);
        }

        if (drivesRes.status === 'fulfilled' && drivesRes.value.success) {
          setDrives(drivesRes.value.data.drives || drivesRes.value.data || []);
        }

        if (appsRes.status === 'fulfilled' && appsRes.value.success) {
          setApplications(appsRes.value.data || []);
        }

        if (interviewsRes.status === 'fulfilled' && interviewsRes.value.success) {
          setInterviews(interviewsRes.value.data || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const upcomingInterview = interviews.find((i) => i.status === 'SCHEDULED');
  const placedOffersCount = applications.filter((a) => a.status === 'SELECTED').length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-lg shadow-indigo-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-3 border border-white/20">
            <span>🎓 Batch of {profile?.batchYear || user?.batchYear || 2026}</span>
            <span>•</span>
            <span>{profile?.department || user?.department || 'Engineering'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-indigo-100 leading-relaxed">
            Your university placement dashboard is synchronized with live records. You have{' '}
            <span className="font-bold underline decoration-white/50">{drives.length} active recruitment drives</span> available and {applications.length} submitted applications.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link to="/student/drives">
              <Button variant="outline" size="sm" className="bg-white text-indigo-700 hover:bg-indigo-50 border-none font-semibold">
                Explore Active Drives
              </Button>
            </Link>
            <Link to="/student/resume/test">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <FileCheck2 className="w-4 h-4 mr-1.5" />
                Run ATS Resume Test
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Placement Status"
          value={profile?.placementStatus || user?.placementStatus || 'Unplaced'}
          subtitle={
            profile?.currentHighestCtc > 0
              ? `Highest CTC: ₹ ${profile.currentHighestCtc} LPA`
              : 'Registered for drives'
          }
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Active Drives"
          value={loading ? '...' : String(drives.length)}
          subtitle="Currently accepting applications"
          icon={Briefcase}
          color="indigo"
        />
        <StatCard
          title="My Applications"
          value={loading ? '...' : String(applications.length)}
          subtitle={`${placedOffersCount} Offer(s) Received`}
          icon={Compass}
          color="blue"
        />
        <StatCard
          title="Interviews"
          value={loading ? '...' : String(interviews.length)}
          subtitle={
            upcomingInterview
              ? `Next: ${new Date(upcomingInterview.date).toLocaleDateString()}`
              : 'No rounds today'
          }
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Upcoming Interview Spotlight Card */}
      {upcomingInterview && (
        <div className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50/50 to-white">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  Upcoming Round
                </span>
                <span className="text-xs text-slate-500">{upcomingInterview.round}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-1">
                {upcomingInterview.recruitmentDrive?.company?.name || 'Partner Company'}
              </h4>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {upcomingInterview.date
                    ? new Date(upcomingInterview.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'TBA'}{' '}
                  • {upcomingInterview.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {upcomingInterview.mode === 'Online' ? 'Virtual Video Call' : upcomingInterview.venue}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Link to="/student/interviews" className="w-full md:w-auto">
              <Button variant="primary" size="sm" className="w-full md:w-auto bg-amber-600 hover:bg-amber-700">
                View Instructions & Link
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Two Column Section: Active Drives & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Drives */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Active Recruitment Drives
            </h3>
            <Link
              to="/student/drives"
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>View all drives</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : drives.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No recruitment drives are currently accepting applications.
            </div>
          ) : (
            <div className="space-y-3">
              {drives.map((drive) => {
                const compName =
                  drive.company?.name || drive.company?.companyName || 'Corporate Partner';
                const pkg = drive.package || drive.ctcPackage;
                const deadline = drive.applicationDeadline
                  ? new Date(drive.applicationDeadline).toLocaleDateString()
                  : 'Open';

                return (
                  <div
                    key={drive._id}
                    className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{compName}</h4>
                          <Badge variant={drive.status}>{drive.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          {drive.jobRole || drive.jobTitle}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                          <span className="font-bold text-emerald-600 text-xs">
                            ₹ {pkg} LPA
                          </span>
                          <span>•</span>
                          <span>Deadline: {deadline}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Link to={`/student/drives/${drive._id}`}>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </Link>
                      <Link to={`/student/drives/${drive._id}/eligibility`}>
                        <Button variant="primary" size="sm">
                          Check & Apply
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Application Tracker */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Application Pipeline
            </h3>
            <Link
              to="/student/applications"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Track all
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-4">
            {applications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                You haven't applied to any drives yet. Check active drives to get started!
              </p>
            ) : (
              applications.slice(0, 4).map((app) => {
                const compName =
                  app.recruitmentDrive?.company?.name ||
                  app.recruitmentDrive?.company?.companyName ||
                  'Company';
                const role = app.recruitmentDrive?.jobRole || app.recruitmentDrive?.jobTitle || 'Role';
                const date = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '';

                return (
                  <div key={app._id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                        {compName}
                      </span>
                      <Badge variant={app.status}>{app.status}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">{role}</p>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                      <span className="font-medium text-indigo-600">{app.currentStage || app.status}</span>
                      <span>{date}</span>
                    </div>
                  </div>
                );
              })
            )}

            <Link to="/student/applications" className="block pt-2">
              <Button variant="secondary" size="sm" className="w-full text-xs">
                View Full Tracking Pipeline
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
