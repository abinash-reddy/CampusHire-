import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { drivesApi, resumesApi } from '../../services/api';
import Button from '../../components/common/Button';

export default function ResumeMatchResults() {
  const [searchParams] = useSearchParams();
  const initialDriveId = searchParams.get('driveId') || '';

  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(initialDriveId);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDrives, setFetchingDrives] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDrives = async () => {
      try {
        const res = await drivesApi.getAll({ limit: 50 });
        if (isMounted && res.success) {
          const list = res.data?.drives || res.data || [];
          setDrives(list);
          if (!selectedDrive && list.length > 0) {
            setSelectedDrive(list[0]._id);
          }
        }
      } catch (err) {
        if (isMounted) setError('Could not load recruitment drives list');
      } finally {
        if (isMounted) setFetchingDrives(false);
      }
    };

    fetchDrives();
    return () => {
      isMounted = false;
    };
  }, []);

  const runMatch = async (driveId) => {
    if (!driveId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await resumesApi.match(driveId);
      if (res.success && res.data) {
        setMatchResult(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to match resume with the selected recruitment drive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDrive) {
      runMatch(selectedDrive);
    }
  }, [selectedDrive]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          Job-Specific Resume Matching
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Compare your active resume directly against a specific recruitment drive's requirements
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {error.toLowerCase().includes('resume') && (
            <Link to="/student/resume/upload">
              <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 bg-white">
                Upload Resume PDF
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Select Drive Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Target Recruitment Drive:
          </label>
          {fetchingDrives ? (
            <p className="text-xs text-slate-400">Loading active recruitment drives...</p>
          ) : drives.length === 0 ? (
            <p className="text-xs text-amber-600 font-medium">No recruitment drives currently scheduled.</p>
          ) : (
            <select
              value={selectedDrive}
              onChange={(e) => setSelectedDrive(e.target.value)}
              className="w-full sm:max-w-md px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
            >
              {drives.map((d) => {
                const comp = d.company?.name || d.company?.companyName || 'Company';
                const role = d.jobRole || d.jobTitle;
                return (
                  <option key={d._id} value={d._id}>
                    {comp} — {role} (₹ {d.package || d.ctcPackage} LPA)
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          loading={loading}
          onClick={() => runMatch(selectedDrive)}
        >
          Re-calculate Match
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[250px] gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Comparing resume keywords against drive requirements...</p>
        </div>
      ) : matchResult ? (
        <>
          {/* Match Percentage Highlight */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center text-2xl font-extrabold text-emerald-300 shrink-0">
                {matchResult.matchPercentage || 0}%
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400">
                  {matchResult.matchPercentage >= 70
                    ? 'Strong Alignment'
                    : matchResult.matchPercentage >= 40
                    ? 'Moderate Alignment'
                    : 'Low Skill Match'}
                </span>
                <h2 className="text-base font-bold mt-0.5">
                  {matchResult.matchedSkills?.length || 0} Matched Skills Identified
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Analysis against {matchResult.missingSkills?.length || 0} missing target skills.
                </p>
              </div>
            </div>
          </div>

          {/* Skill Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Matched Skills ({matchResult.matchedSkills?.length || 0})
                </h3>
              </div>
              <p className="text-xs text-slate-500">Skills present in both your resume and the drive requirements:</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {matchResult.matchedSkills?.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Missing Skills Gap ({matchResult.missingSkills?.length || 0})
                </h3>
              </div>
              <p className="text-xs text-slate-500">Skills requested by recruiter not detected on your resume:</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {matchResult.missingSkills?.length === 0 ? (
                  <span className="text-xs text-emerald-600 font-semibold">Zero skills missing! You match all requirements.</span>
                ) : (
                  matchResult.missingSkills?.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                    >
                      ! {s}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tailoring Recommendations */}
          {matchResult.suggestions && matchResult.suggestions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Tailoring Suggestions for this Drive:
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {matchResult.suggestions.map((sug, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
