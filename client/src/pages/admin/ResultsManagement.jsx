import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { resultsApi, drivesApi, adminStudentsApi } from '../../services/api';

export default function ResultsManagement() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [drives, setDrives] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [newResult, setNewResult] = useState({
    student: '',
    recruitmentDrive: '',
    package: 10.0,
    status: 'SELECTED',
    remarks: 'Selected through on-campus recruitment drive',
  });

  useEffect(() => {
    fetchResults();
    fetchModalOptions();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await resultsApi.getAll();
      if (res.success) {
        setResults(res.data?.results || res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setError(err.message || 'Unable to load recruitment results');
    } finally {
      setLoading(false);
    }
  };

  const fetchModalOptions = async () => {
    try {
      const [drivesRes, studentsRes] = await Promise.allSettled([
        drivesApi.getAll({ limit: 100 }),
        adminStudentsApi.getAll({ limit: 100 }),
      ]);

      if (drivesRes.status === 'fulfilled' && drivesRes.value.success) {
        const dList = drivesRes.value.data?.drives || drivesRes.value.data || [];
        setDrives(dList);
        if (dList.length > 0 && !newResult.recruitmentDrive) {
          setNewResult((prev) => ({
            ...prev,
            recruitmentDrive: dList[0]._id,
            package: dList[0].package || dList[0].ctcPackage || 10.0,
          }));
        }
      }

      if (studentsRes.status === 'fulfilled' && studentsRes.value.success) {
        const sList = studentsRes.value.data?.students || studentsRes.value.data || [];
        setStudents(sList);
        if (sList.length > 0 && !newResult.student) {
          setNewResult((prev) => ({ ...prev, student: sList[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load drive or student options:', err);
    }
  };

  const handleDriveChange = (driveId) => {
    const selectedDrive = drives.find((d) => d._id === driveId);
    setNewResult((prev) => ({
      ...prev,
      recruitmentDrive: driveId,
      package: selectedDrive ? (selectedDrive.package || selectedDrive.ctcPackage || prev.package) : prev.package,
    }));
  };

  const handlePublishResult = async (e) => {
    e.preventDefault();
    if (!newResult.student || !newResult.recruitmentDrive) {
      setFormError('Please select both a student candidate and a recruitment drive.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        student: newResult.student,
        recruitmentDrive: newResult.recruitmentDrive,
        package: parseFloat(newResult.package) || 0,
        status: newResult.status,
        remarks: newResult.remarks.trim() || undefined,
        resultDate: new Date().toISOString(),
      };

      const res = await resultsApi.publish(payload);
      if (res.success) {
        setSuccessMsg(`Official placement result published successfully!`);
        setIsPublishModalOpen(false);
        fetchResults();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to publish result:', err);
      setFormError(err.message || 'Failed to publish recruitment result');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = results.filter((item) => {
    const studentName = item.student?.user?.name || item.student?.name || '';
    const rollNo = item.student?.rollNumber || '';
    const compName = item.company?.name || item.company?.companyName || item.company || '';
    return (
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      rollNo.toLowerCase().includes(search.toLowerCase()) ||
      compName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-indigo-600" />
            Recruitment Results & Selections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish official recruitment outcomes, log candidate compensation CTC, and update student placement statuses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchResults} loading={loading}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setFormError(null);
              setIsPublishModalOpen(true);
            }}
          >
            Publish New Result
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
            placeholder="Search results by student, roll number, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading published results...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Placement Results Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Publish New Result" above to announce candidate selections and update student placement statuses.
          </p>
        </div>
      ) : (
        <Table
          headers={[
            'Candidate Student',
            'Company & Designation',
            'Offered CTC',
            'Outcome Status',
            'Result Date',
            'Remarks / Notes',
          ]}
        >
          {filtered.map((item) => {
            const studentObj = item.student || {};
            const studentName = studentObj.user?.name || studentObj.name || 'Candidate';
            const rollNo = studentObj.rollNumber || 'N/A';
            const dept = studentObj.department || 'N/A';

            const compName = item.company?.name || item.company?.companyName || item.company || 'Hiring Partner';
            const role = item.jobRole || item.recruitmentDrive?.jobTitle || 'Engineering';

            const formattedDate = item.resultDate
              ? new Date(item.resultDate).toLocaleDateString(undefined, {
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
                    <p className="text-[11px] text-slate-400">{rollNo} • {dept}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-800">{compName}</p>
                    <p className="text-[11px] text-slate-400">{role}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-emerald-600">
                  ₹ {item.package || 'Confidential'} {item.package ? 'LPA' : ''}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.status}>{item.status}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{formattedDate}</td>
                <td className="px-4 py-3 text-slate-500 text-xs italic">{item.remarks || '-'}</td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* Publish Result Modal */}
      {isPublishModalOpen && (
        <Modal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          title="Publish Recruitment Result"
          subtitle="Finalize recruitment decision for candidate. Selected outcomes automatically update student placement record."
        >
          <form onSubmit={handlePublishResult} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Student *
                </label>
                <select
                  required
                  value={newResult.student}
                  onChange={(e) => setNewResult({ ...newResult, student: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Select Candidate</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.user?.name || s.name || 'Student'} ({s.rollNumber} • {s.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recruitment Drive *
                </label>
                <select
                  required
                  value={newResult.recruitmentDrive}
                  onChange={(e) => handleDriveChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Select Recruitment Drive</option>
                  {drives.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.company?.name || d.company || 'Company'} — {d.jobTitle || d.jobRole} (₹ {d.package || d.ctcPackage} LPA)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Final Result Status *
                </label>
                <select
                  value={newResult.status}
                  onChange={(e) => setNewResult({ ...newResult, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="SELECTED">SELECTED (Marks candidate as Placed)</option>
                  <option value="WAITLISTED">WAITLISTED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offered Package CTC (in LPA) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newResult.package}
                  onChange={(e) => setNewResult({ ...newResult, package: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarks / Offer Note
              </label>
              <input
                type="text"
                placeholder="e.g. Selected through campus recruitment drive"
                value={newResult.remarks}
                onChange={(e) => setNewResult({ ...newResult, remarks: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsPublishModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Publish Official Result
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
