import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  Building2,
  XCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { applicationsApi } from '../../services/api';
import Badge from '../../components/common/Badge';

export default function ApplicationTracking() {
  const [filter, setFilter] = useState('ALL');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await applicationsApi.getMy();
        if (isMounted && res.success) {
          setApplications(res.data || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch applications');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApplications();
    return () => {
      isMounted = false;
    };
  }, []);

  const STAGE_ORDER = [
    'APPLIED',
    'SHORTLISTED',
    'ASSESSMENT',
    'TECHNICAL_INTERVIEW',
    'HR_INTERVIEW',
    'SELECTED',
  ];

  const getStageStatus = (appStatus, stageKey) => {
    if (appStatus === 'REJECTED') {
      return stageKey === 'APPLIED' ? 'completed' : 'rejected';
    }
    const currentIndex = STAGE_ORDER.indexOf(appStatus);
    const stageIndex = STAGE_ORDER.indexOf(stageKey);

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  const filtered = applications.filter((app) => {
    if (filter === 'ALL') return true;
    return app.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Compass className="w-6 h-6 text-indigo-600" />
          My Recruitment Applications
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Live stage-by-stage progression tracking for all drives you have applied to
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 pb-2 overflow-x-auto">
        {['ALL', 'SHORTLISTED', 'ASSESSMENT', 'SELECTED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === st
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Application Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No applications found matching the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const compName =
              app.recruitmentDrive?.company?.name ||
              app.recruitmentDrive?.company?.companyName ||
              'Hiring Partner';
            const role = app.recruitmentDrive?.jobRole || app.recruitmentDrive?.jobTitle || 'Role';
            const pkg = app.recruitmentDrive?.package || app.recruitmentDrive?.ctcPackage;
            const appliedDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '';

            return (
              <div
                key={app._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5"
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{compName}</h3>
                      <p className="text-xs text-slate-500">
                        {role} {pkg ? `• ₹ ${pkg} LPA` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      Applied: {appliedDate}
                    </span>
                    <Badge variant={app.status}>{app.status}</Badge>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between overflow-x-auto pb-2">
                    {STAGE_ORDER.map((stageKey, idx) => {
                      const state = getStageStatus(app.status, stageKey);
                      const isCompleted = state === 'completed';
                      const isActive = state === 'active';
                      const isRejected = state === 'rejected';

                      return (
                        <div
                          key={stageKey}
                          className="flex-1 flex flex-col items-center text-center px-1 min-w-[90px] relative"
                        >
                          {/* Connecting line */}
                          {idx < STAGE_ORDER.length - 1 && (
                            <div
                              className={`absolute top-3.5 left-[50%] w-full h-0.5 z-0 ${
                                isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                              }`}
                            />
                          )}

                          {/* Step Icon */}
                          <div
                            className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isActive
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                : isRejected
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : isRejected ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>

                          <span className="text-[10px] font-semibold text-slate-800 mt-2 capitalize truncate w-full">
                            {stageKey.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage Remark Banner */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    Current Stage:{' '}
                    <span className="font-bold text-slate-900">
                      {app.currentStage || app.status}
                    </span>
                  </span>
                  {app.matchScore > 0 && (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Resume Match: {app.matchScore}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
