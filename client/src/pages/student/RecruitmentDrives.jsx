import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { drivesApi } from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function RecruitmentDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchDrives = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (selectedBranch !== 'ALL') params.branch = selectedBranch;
        if (selectedStatus !== 'ALL') params.status = selectedStatus;
        if (search.trim()) params.search = search.trim();

        const res = await drivesApi.getAll(params);
        if (isMounted && res.success) {
          setDrives(res.data?.drives || res.data || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch recruitment drives');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const debounce = setTimeout(fetchDrives, 250);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [search, selectedBranch, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Briefcase className="w-6 h-6 text-indigo-600" />
          On-Campus Recruitment Drives
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore hiring partner opportunities, verify academic eligibility criteria, and submit applications
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by company or job role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="UPCOMING">UPCOMING</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      {/* Grid of Drives */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : drives.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No recruitment drives matched your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drives.map((drive) => {
            const compName =
              drive.company?.name || drive.company?.companyName || 'Corporate Partner';
            const tier = drive.company?.tier || 'Normal';
            const pkg = drive.package || drive.ctcPackage;
            const role = drive.jobRole || drive.jobTitle;
            const deadline = drive.applicationDeadline
              ? new Date(drive.applicationDeadline).toLocaleDateString()
              : 'Open';

            return (
              <div
                key={drive._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={tier}>{tier}</Badge>
                    <Badge variant={drive.status}>{drive.status}</Badge>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 truncate">{compName}</h3>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-700 mt-1 line-clamp-1">
                    {role}
                  </h4>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Offered CTC:</span>
                      <span className="font-bold text-emerald-600 text-xs">₹ {pkg} LPA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Min CGPA:</span>
                      <span className="font-semibold text-slate-800">{drive.minimumCGPA}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Backlogs:</span>
                      <span className="font-semibold text-slate-800">{drive.maximumBacklogs} max</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deadline:</span>
                      <span className="font-semibold text-slate-800">{deadline}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {(drive.eligibleBranches || []).map((b) => (
                      <span
                        key={b}
                        className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <Link to={`/student/drives/${drive._id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Overview
                    </Button>
                  </Link>
                  <Link to={`/student/drives/${drive._id}/eligibility`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full text-xs">
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
  );
}
