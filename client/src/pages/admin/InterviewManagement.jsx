import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Building2,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { interviewsApi, applicationsApi } from '../../services/api';

import { useSearchParams } from 'react-router-dom';

const getCompanyName = (comp) => {
  if (!comp) return 'Hiring Partner';
  if (typeof comp === 'string') return comp;
  if (typeof comp === 'object') return comp.name || comp.companyName || 'Hiring Partner';
  return 'Hiring Partner';
};

const getStudentName = (student) => {
  if (!student) return 'Candidate Student';
  if (typeof student === 'string') return student;
  if (typeof student === 'object') return student.user?.name || student.name || 'Candidate Student';
  return 'Candidate Student';
};

const getJobRole = (drive) => {
  if (!drive) return 'Role';
  if (typeof drive === 'string') return drive;
  return drive.jobRole || drive.jobTitle || 'Role';
};

export default function InterviewManagement() {
  const [searchParams] = useSearchParams();
  const preselectAppId = searchParams.get('applicationId');

  const [search, setSearch] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [newInterview, setNewInterview] = useState({
    application: preselectAppId || '',
    round: 'Technical Interview 1',
    date: '',
    time: '10:30 AM',
    mode: 'Online',
    meetingLink: '',
    venue: '',
    instructions: 'Please be online 5 minutes before scheduled slot.',
  });

  useEffect(() => {
    fetchInterviews();
    fetchEligibleApplications();
  }, []);

  useEffect(() => {
    if (preselectAppId && applications.length > 0) {
      setNewInterview((prev) => ({ ...prev, application: preselectAppId }));
      setIsScheduleModalOpen(true);
    }
  }, [preselectAppId, applications]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await interviewsApi.getAdminAll();
      if (res.success) {
        setInterviews(res.data?.interviews || res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
      setError(err.message || 'Unable to load interview schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleApplications = async () => {
    try {
      const res = await applicationsApi.getAdminAll({ limit: 100 });
      if (res.success) {
        const apps = res.data?.applications || res.data || [];
        setApplications(apps);
        if (apps.length > 0 && !newInterview.application) {
          setNewInterview((prev) => ({ ...prev, application: preselectAppId || apps[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load candidate applications for modal:', err);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!newInterview.application) {
      setFormError('Please select a candidate application.');
      return;
    }
    if (!newInterview.date || !newInterview.time) {
      setFormError('Please provide both interview date and time.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        application: newInterview.application,
        round: newInterview.round.trim(),
        date: newInterview.date,
        time: newInterview.time.trim(),
        mode: newInterview.mode,
        meetingLink: newInterview.mode === 'Online' ? (newInterview.meetingLink.trim() || undefined) : undefined,
        venue: newInterview.mode === 'Offline' ? (newInterview.venue.trim() || undefined) : undefined,
        instructions: newInterview.instructions.trim() || undefined,
        status: 'SCHEDULED',
      };

      const res = await interviewsApi.schedule(payload);
      if (res.success) {
        setSuccessMsg(`Interview slot scheduled successfully for ${newInterview.round}!`);
        setIsScheduleModalOpen(false);
        setNewInterview({
          application: applications[0]?._id || '',
          round: 'Technical Interview 1',
          date: '',
          time: '10:30 AM',
          mode: 'Online',
          meetingLink: '',
          venue: '',
          instructions: 'Please be online 5 minutes before scheduled slot.',
        });
        fetchInterviews();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to schedule interview:', err);
      setFormError(err.message || 'Failed to schedule interview round');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = interviews.filter((item) => {
    const studentName = getStudentName(item.student);
    const compName = getCompanyName(item.recruitmentDrive?.company);
    return (
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      compName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Interview Rounds Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule candidate interview slots, manage venues, and dispatch meeting video links
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchInterviews} loading={loading}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setFormError(null);
              setIsScheduleModalOpen(true);
            }}
          >
            Schedule Interview Slot
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading scheduled interviews...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Interview Slots Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Schedule Interview Slot" above to set up online or on-campus rounds for shortlisted applicants.
          </p>
        </div>
      ) : (
        <Table
          headers={[
            'Candidate Student',
            'Company & Drive',
            'Round Name',
            'Scheduled Date & Time',
            'Mode',
            'Venue / Link',
            'Status',
          ]}
        >
          {filtered.map((item) => {
            const studentObj = item.student || {};
            const studentName = getStudentName(studentObj);
            const rollNo = studentObj.rollNumber || 'N/A';

            const driveObj = item.recruitmentDrive || {};
            const compName = getCompanyName(driveObj.company);

            const formattedDate = item.date
              ? new Date(item.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A';

            return (
              <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-900">{studentName}</p>
                    <p className="text-[11px] text-slate-400">{rollNo}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">{compName}</td>
                <td className="px-4 py-3 text-xs text-indigo-600 font-medium">{item.round}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formattedDate} • {item.time}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.mode === 'Online' ? 'info' : 'neutral'}>
                    {item.mode}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs">
                  {item.mode === 'Online' && item.meetingLink ? (
                    <a
                      href={item.meetingLink.startsWith('http') ? item.meetingLink : `https://${item.meetingLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 underline truncate max-w-xs block"
                    >
                      {item.meetingLink}
                    </a>
                  ) : (
                    <span className="text-slate-600">{item.venue || 'TBA'}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.status || 'SCHEDULED'}>{item.status || 'SCHEDULED'}</Badge>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* Schedule Interview Modal */}
      {isScheduleModalOpen && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          title="Schedule New Interview Slot"
          subtitle="Notify shortlisted candidates with interview timing and meeting link"
        >
          <form onSubmit={handleSchedule} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Candidate Application *
              </label>
              <select
                required
                value={newInterview.application}
                onChange={(e) => setNewInterview({ ...newInterview, application: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Select Candidate Application</option>
                {applications.map((app) => {
                  const sName = getStudentName(app.student);
                  const cName = getCompanyName(app.recruitmentDrive?.company);
                  const role = getJobRole(app.recruitmentDrive);
                  return (
                    <option key={app._id} value={app._id}>
                      {sName} ({app.student?.rollNumber || 'ID'}) — {cName} ({role}) [{app.status}]
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Round Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Technical Interview Round 1"
                value={newInterview.round}
                onChange={(e) => setNewInterview({ ...newInterview, round: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={newInterview.date}
                  onChange={(e) => setNewInterview({ ...newInterview, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10:30 AM"
                  value={newInterview.time}
                  onChange={(e) => setNewInterview({ ...newInterview, time: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mode</label>
                <select
                  value={newInterview.mode}
                  onChange={(e) => setNewInterview({ ...newInterview, mode: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Online">Online Video Call</option>
                  <option value="Offline">Offline Hall / Campus</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {newInterview.mode === 'Online' ? 'Meeting Video Link (Google Meet / Zoom / Teams)' : 'Campus Venue / Hall Details'}
              </label>
              <input
                type="text"
                placeholder={newInterview.mode === 'Online' ? 'https://meet.google.com/xyz-abc' : 'e.g. Seminar Hall 2, Placement Block'}
                value={newInterview.mode === 'Online' ? newInterview.meetingLink : newInterview.venue}
                onChange={(e) => {
                  if (newInterview.mode === 'Online') {
                    setNewInterview({ ...newInterview, meetingLink: e.target.value });
                  } else {
                    setNewInterview({ ...newInterview, venue: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions for Candidate</label>
              <textarea
                rows={2}
                value={newInterview.instructions}
                onChange={(e) => setNewInterview({ ...newInterview, instructions: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Schedule & Notify Candidate
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
