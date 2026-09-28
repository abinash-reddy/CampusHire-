import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Building2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { interviewsApi } from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function InterviewSchedule() {
  const [tab, setTab] = useState('UPCOMING');
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchInterviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await interviewsApi.getMy();
        if (isMounted && res.success) {
          setInterviews(res.data || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch interview schedules');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInterviews();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = interviews.filter((item) => {
    if (tab === 'UPCOMING') return item.status === 'SCHEDULED' || item.status === 'RESCHEDULED';
    return item.status !== 'SCHEDULED' && item.status !== 'RESCHEDULED';
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Calendar className="w-6 h-6 text-indigo-600" />
          My Interview Schedule
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Confirmed interview rounds, dates, venues, and meeting instructions
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('UPCOMING')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === 'UPCOMING'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Upcoming Interviews
        </button>
        <button
          onClick={() => setTab('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === 'COMPLETED'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Completed History
        </button>
      </div>

      {/* Interview Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No {tab.toLowerCase()} interviews found on your schedule.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const compName =
              item.recruitmentDrive?.company?.name ||
              item.recruitmentDrive?.company?.companyName ||
              'Corporate Partner';
            const role = item.recruitmentDrive?.jobRole || item.recruitmentDrive?.jobTitle || 'Role';

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{compName}</h3>
                      <p className="text-xs text-slate-500">{role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={item.mode === 'Online' ? 'info' : 'neutral'}>
                      {item.mode}
                    </Badge>
                    <Badge variant={item.status === 'SCHEDULED' ? 'OPEN' : 'COMPLETED'}>
                      {item.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-slate-800">{item.round}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>
                      {item.date
                        ? new Date(item.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'TBA'}{' '}
                      • {item.time}
                    </span>
                  </div>
                </div>

                {/* Venue or Link Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    {item.mode === 'Online' ? (
                      <>
                        <Video className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-slate-800">Video Link:</span>
                        <span className="text-indigo-600 underline font-mono text-[11px] truncate max-w-xs">
                          {item.meetingLink || 'Link will be enabled 15 mins prior'}
                        </span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-slate-800">Physical Venue:</span>
                        <span className="text-slate-600">{item.venue || 'Campus TPO Hall'}</span>
                      </>
                    )}
                  </div>

                  {item.mode === 'Online' && item.meetingLink && (
                    <a href={item.meetingLink} target="_blank" rel="noreferrer">
                      <Button variant="emerald" size="sm" icon={ExternalLink} iconPosition="right">
                        Join Call
                      </Button>
                    </a>
                  )}
                </div>

                {/* Instructions */}
                {item.instructions && (
                  <div className="text-xs text-slate-500 flex items-start gap-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{item.instructions}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
