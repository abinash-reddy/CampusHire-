import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  Calendar,
  Edit2,
  User,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { applicationsApi } from '../../services/api';

export default function ApplicationManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [activeApp, setActiveApp] = useState(null);
  const [newStatus, setNewStatus] = useState('SHORTLISTED');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await applicationsApi.getAdminAll(params);
      if (res.success) {
        setApplications(res.data?.applications || res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError(err.message || 'Unable to load candidate applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!activeApp) return;

    try {
      setSubmitting(true);
      setModalError(null);

      const res = await applicationsApi.updateStatus(activeApp._id, {
        status: newStatus,
        stage: remarks.trim() || `${newStatus} Stage`,
        remarks: remarks.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg(`Candidate application updated to ${newStatus}`);
        setActiveApp(null);
        setRemarks('');
        fetchApplications();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update application status:', err);
      setModalError(err.message || 'Failed to update application status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-indigo-600" />
            Candidate Application Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review candidate applications, shortlist candidates for interviews, and update round outcomes
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchApplications} loading={loading}>
          Refresh
        </Button>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student, roll number, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 w-full md:w-auto"
        >
          <option value="ALL">All Application Statuses</option>
          <option value="APPLIED">APPLIED</option>
          <option value="SHORTLISTED">SHORTLISTED</option>
          <option value="ASSESSMENT">ASSESSMENT</option>
          <option value="TECHNICAL_INTERVIEW">TECHNICAL_INTERVIEW</option>
          <option value="HR_INTERVIEW">HR_INTERVIEW</option>
          <option value="SELECTED">SELECTED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="WITHDRAWN">WITHDRAWN</option>
        </select>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <Compass className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Applications Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Candidate applications will appear here as students apply for recruitment drives.
          </p>
        </div>
      ) : (
        <Table
          headers={[
            'Student Name & Branch',
            'Recruitment Drive',
            'CGPA',
            'Applied Date',
            'Current Stage',
            'Status',
            'Action',
          ]}
        >
          {applications.map((app) => {
            const studentObj = app.student || {};
            const studentName = studentObj.user?.name || studentObj.name || 'Candidate';
            const rollNo = studentObj.rollNumber || 'N/A';
            const dept = studentObj.department || 'N/A';
            const cgpa = studentObj.cgpa !== undefined ? studentObj.cgpa : 'N/A';

            const driveObj = app.recruitmentDrive || {};
            const compName = driveObj.company?.name || driveObj.company || 'Hiring Partner';
            const roleName = driveObj.jobTitle || driveObj.jobRole || 'Engineering';

            const appliedDate = app.appliedAt || app.createdAt
              ? new Date(app.appliedAt || app.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A';

            return (
              <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-900">{studentName}</p>
                    <p className="text-[11px] text-slate-500">{rollNo} • {dept}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-800">{compName}</p>
                    <p className="text-[11px] text-slate-400">{roleName}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">{cgpa}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{appliedDate}</td>
                <td className="px-4 py-3 text-xs text-indigo-600 font-medium">
                  {app.stage || app.currentStage || 'Application Review'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={app.status}>{app.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit2}
                      onClick={() => {
                        setActiveApp(app);
                        setNewStatus(app.status);
                        setRemarks(app.remarks || app.stage || '');
                        setModalError(null);
                      }}
                    >
                      Status
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Calendar}
                      onClick={() => navigate(`/admin/interviews?applicationId=${app._id}`)}
                    >
                      Schedule
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* Update Status Modal */}
      {activeApp && (
        <Modal
          isOpen={!!activeApp}
          onClose={() => setActiveApp(null)}
          title={`Update Status: ${activeApp.student?.user?.name || activeApp.student?.name || 'Candidate'}`}
          subtitle={`${activeApp.recruitmentDrive?.company?.name || 'Hiring Partner'} — ${activeApp.recruitmentDrive?.jobTitle || 'Role'}`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            {modalError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Application Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="APPLIED">APPLIED</option>
                <option value="SHORTLISTED">SHORTLISTED</option>
                <option value="ASSESSMENT">ASSESSMENT</option>
                <option value="TECHNICAL_INTERVIEW">TECHNICAL_INTERVIEW</option>
                <option value="HR_INTERVIEW">HR_INTERVIEW</option>
                <option value="SELECTED">SELECTED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="WITHDRAWN">WITHDRAWN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarks / Current Stage Description
              </label>
              <input
                type="text"
                placeholder="e.g. Cleared round 1 online assessment"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setActiveApp(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Save Status Change
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
