import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle,
  X,
  GraduationCap,
  Award,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { adminStudentsApi } from '../../services/api';

export default function StudentManagement() {
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModalStudent, setActiveModalStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [selectedBranch, selectedStatus]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedBranch !== 'ALL') params.department = selectedBranch;
      if (selectedStatus !== 'ALL') params.placementStatus = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const res = await adminStudentsApi.getAll(params);
      if (res.success) {
        setStudents(res.data?.students || res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError(err.message || 'Unable to load student directory');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleViewDetails = async (student) => {
    try {
      setActiveModalStudent(student);
      setModalLoading(true);
      const res = await adminStudentsApi.getById(student._id);
      if (res.success && res.data) {
        setActiveModalStudent(res.data);
      }
    } catch (err) {
      console.error('Failed to load student full details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            Student Placement Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor verified academic records, placement readiness, and candidate application history
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchStudents} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Placed">Placed</option>
            <option value="Unplaced">Unplaced</option>
            <option value="Opted Out">Opted Out</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading candidate records...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Student Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No registered students matched your department or search query.
          </p>
        </div>
      ) : (
        <Table
          headers={[
            'Student Name & Roll No',
            'Department',
            'Batch',
            'CGPA',
            'Backlogs',
            'Placement Status',
            'Highest CTC',
            'Actions',
          ]}
        >
          {students.map((s) => {
            const studentName = s.user?.name || s.name || 'Student Candidate';
            const studentEmail = s.user?.email || s.email || 'N/A';
            const rollNo = s.rollNumber || 'N/A';
            const dept = s.department || 'N/A';
            const batch = s.batchYear || '2026';
            const cgpa = s.cgpa !== undefined ? s.cgpa : 'N/A';
            const backlogs = s.activeBacklogs !== undefined ? s.activeBacklogs : 0;
            const status = s.placementStatus || 'Unplaced';
            const highestOffer = s.highestCtc || s.highestPackage || 0;

            return (
              <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-900">{studentName}</p>
                    <p className="text-[11px] text-slate-400">{rollNo} • {studentEmail}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700">{dept}</td>
                <td className="px-4 py-3 text-slate-600">{batch}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{cgpa}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-semibold ${
                      backlogs === 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {backlogs}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={status === 'Placed' ? 'SELECTED' : 'neutral'}>
                    {status}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-bold text-emerald-600">
                  {highestOffer > 0 ? `₹ ${highestOffer} LPA` : '-'}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => handleViewDetails(s)}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* Student Details Modal */}
      {activeModalStudent && (
        <Modal
          isOpen={!!activeModalStudent}
          onClose={() => setActiveModalStudent(null)}
          title={`Candidate Profile: ${activeModalStudent.user?.name || activeModalStudent.name || 'Candidate'}`}
          subtitle={`Roll No: ${activeModalStudent.rollNumber} • ${activeModalStudent.department}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setActiveModalStudent(null)}>
              Close
            </Button>
          }
        >
          {modalLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading student details...</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic CGPA</span>
                  <span className="font-bold text-slate-900 text-sm">{activeModalStudent.cgpa} / 10.0</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Active Backlogs</span>
                  <span className="font-bold text-slate-900 text-sm">{activeModalStudent.activeBacklogs ?? 0}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">10th / 12th Percentage</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {activeModalStudent.tenthPercentage ? `${activeModalStudent.tenthPercentage}%` : 'N/A'} / {activeModalStudent.twelfthPercentage ? `${activeModalStudent.twelfthPercentage}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Placement Status</span>
                  <span className="font-bold text-indigo-600 text-sm">
                    {activeModalStudent.placementStatus || 'Unplaced'}
                  </span>
                </div>
              </div>

              {activeModalStudent.skills && activeModalStudent.skills.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Technical Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeModalStudent.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeModalStudent.placementOffers && activeModalStudent.placementOffers.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[11px] mb-2 font-bold uppercase">Placement Offers ({activeModalStudent.placementOffers.length})</span>
                  <div className="space-y-2">
                    {activeModalStudent.placementOffers.map((offer, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{offer.company?.name || offer.company || 'Hiring Partner'}</p>
                          <p className="text-[10px] text-slate-500">{offer.jobRole || 'Engineering'}</p>
                        </div>
                        <span className="font-extrabold text-emerald-600">₹ {offer.package} LPA</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
