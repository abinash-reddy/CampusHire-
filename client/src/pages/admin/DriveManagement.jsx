import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  Calendar,
  DollarSign,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { drivesApi, companiesApi } from '../../services/api';

export default function DriveManagement() {
  const [search, setSearch] = useState('');
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [newDrive, setNewDrive] = useState({
    company: '',
    jobRole: '',
    package: 10.0,
    minimumCGPA: 6.5,
    maximumBacklogs: 0,
    eligibleBranches: ['CSE', 'IT', 'ECE'],
    graduationYear: 2026,
    numberOfPositions: 5,
    applicationDeadline: '',
    driveDate: '',
    status: 'OPEN',
  });

  const availableBranches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

  useEffect(() => {
    fetchDrives();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await companiesApi.getAll({ limit: 100 });
      if (res.success) {
        const comps = res.data?.companies || res.data || [];
        setCompanies(comps);
        if (comps.length > 0 && !newDrive.company) {
          setNewDrive((prev) => ({ ...prev, company: comps[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load companies for drive modal:', err);
    }
  };

  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await drivesApi.getAll(params);
      if (res.success) {
        setDrives(res.data?.drives || res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch drives:', err);
      setError(err.message || 'Unable to load recruitment drives');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDrives();
  };

  const toggleBranch = (branch) => {
    setNewDrive((prev) => {
      const exists = prev.eligibleBranches.includes(branch);
      return {
        ...prev,
        eligibleBranches: exists
          ? prev.eligibleBranches.filter((b) => b !== branch)
          : [...prev.eligibleBranches, branch],
      };
    });
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    if (!newDrive.company) {
      setFormError('Please select or register a partner company first.');
      return;
    }
    if (!newDrive.jobRole.trim()) {
      setFormError('Please provide a job title / designation.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        company: newDrive.company,
        jobTitle: newDrive.jobRole.trim(),
        jobRole: newDrive.jobRole.trim(),
        jobDescription: `On-campus recruitment drive for ${newDrive.jobRole.trim()}`,
        package: parseFloat(newDrive.package),
        ctcPackage: parseFloat(newDrive.package),
        minimumCGPA: parseFloat(newDrive.minimumCGPA) || 6.0,
        maximumBacklogs: parseInt(newDrive.maximumBacklogs, 10) || 0,
        eligibleBranches: newDrive.eligibleBranches,
        graduationYear: parseInt(newDrive.graduationYear, 10) || 2026,
        numberOfPositions: parseInt(newDrive.numberOfPositions, 10) || 1,
        applicationDeadline: newDrive.applicationDeadline,
        driveDate: newDrive.driveDate,
        status: newDrive.status || 'OPEN',
      };

      const res = await drivesApi.create(payload);
      if (res.success) {
        setSuccessMsg(`Recruitment drive for "${newDrive.jobRole}" published successfully!`);
        setIsCreateModalOpen(false);
        setNewDrive({
          company: companies[0]?._id || '',
          jobRole: '',
          package: 10.0,
          minimumCGPA: 6.5,
          maximumBacklogs: 0,
          eligibleBranches: ['CSE', 'IT', 'ECE'],
          graduationYear: 2026,
          numberOfPositions: 5,
          applicationDeadline: '',
          driveDate: '',
          status: 'OPEN',
        });
        fetchDrives();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to create recruitment drive:', err);
      setFormError(err.message || 'Failed to create recruitment drive');
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
            <Briefcase className="w-6 h-6 text-indigo-600" />
            Recruitment Drive Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, publish, and configure on-campus recruitment drives and eligibility constraints
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchDrives} loading={loading}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
          >
            Schedule New Drive
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search drives by company or job role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </div>

      {/* Drives Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading recruitment drives...</p>
        </div>
      ) : drives.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Recruitment Drives Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Schedule New Drive" above to launch on-campus applications for students.
          </p>
        </div>
      ) : (
        <Table
          headers={[
            'Company & Designation',
            'CTC Package',
            'Min CGPA / Backlogs',
            'Allowed Branches',
            'Deadline',
            'Positions',
            'Status',
          ]}
        >
          {drives.map((d) => {
            const compName = d.company?.name || d.company || 'Hiring Partner';
            const role = d.jobTitle || d.jobRole || 'Engineering Trainee';
            const pkg = d.ctcPackage || d.package || 'N/A';
            const branches = d.eligibleBranches || [];
            const deadlineFormatted = d.applicationDeadline
              ? new Date(d.applicationDeadline).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A';

            return (
              <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-900">{compName}</p>
                    <p className="text-[11px] text-slate-500">{role}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-emerald-600">
                  ₹ {pkg} LPA
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <span className="font-semibold">{d.minimumCGPA ?? 6.0}</span> / {d.maximumBacklogs ?? 0} max
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[140px]">
                    {branches.map((b) => (
                      <span key={b} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                        {b}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{deadlineFormatted}</td>
                <td className="px-4 py-3">
                  <span className="font-bold text-indigo-600">{d.numberOfPositions || 1}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={d.status}>{d.status}</Badge>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* Create Drive Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Recruitment Drive"
          subtitle="Publish a new recruitment drive for college students"
        >
          <form onSubmit={handleCreateDrive} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company *</label>
                <select
                  required
                  value={newDrive.company}
                  onChange={(e) => setNewDrive({ ...newDrive, company: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Select Partner Company</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.tier || 'Normal'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SDE-1 Trainee"
                  value={newDrive.jobRole}
                  onChange={(e) => setNewDrive({ ...newDrive, jobRole: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Package (CTC in LPA) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newDrive.package}
                  onChange={(e) => setNewDrive({ ...newDrive, package: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min CGPA</label>
                <input
                  type="number"
                  step="0.1"
                  value={newDrive.minimumCGPA}
                  onChange={(e) => setNewDrive({ ...newDrive, minimumCGPA: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Backlogs</label>
                <input
                  type="number"
                  value={newDrive.maximumBacklogs}
                  onChange={(e) => setNewDrive({ ...newDrive, maximumBacklogs: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Eligible Departments</label>
              <div className="flex flex-wrap gap-2">
                {availableBranches.map((branch) => {
                  const selected = newDrive.eligibleBranches.includes(branch);
                  return (
                    <button
                      type="button"
                      key={branch}
                      onClick={() => toggleBranch(branch)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {branch}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Application Deadline *</label>
                <input
                  type="date"
                  required
                  value={newDrive.applicationDeadline}
                  onChange={(e) => setNewDrive({ ...newDrive, applicationDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Drive Start Date *</label>
                <input
                  type="date"
                  required
                  value={newDrive.driveDate}
                  onChange={(e) => setNewDrive({ ...newDrive, driveDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Create & Publish Drive
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
