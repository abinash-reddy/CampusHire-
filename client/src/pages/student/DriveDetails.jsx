import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  FileCheck2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { drivesApi } from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function DriveDetails() {
  const { id } = useParams();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDrive = async () => {
      setLoading(true);
      try {
        const res = await drivesApi.getById(id);
        if (isMounted && res.success) {
          setDrive(res.data);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load drive details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) fetchDrive();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !drive) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Recruitment Drive Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'The requested recruitment drive does not exist.'}</p>
        <Link to="/student/drives">
          <Button variant="outline" size="sm">
            Back to Drives
          </Button>
        </Link>
      </div>
    );
  }

  const compName = drive.company?.name || drive.company?.companyName || 'Corporate Partner';
  const tier = drive.company?.tier || 'Normal';
  const pkg = drive.package || drive.ctcPackage;
  const role = drive.jobRole || drive.jobTitle;
  const deadline = drive.applicationDeadline
    ? new Date(drive.applicationDeadline).toLocaleDateString()
    : 'Open';
  const driveDate = drive.driveDate
    ? new Date(drive.driveDate).toLocaleDateString()
    : 'TBA';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/student/drives"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Recruitment Drives</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{compName}</h1>
              <Badge variant={tier}>{tier}</Badge>
            </div>
            <p className="text-sm font-semibold text-slate-700">{role}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {drive.location || 'Multiple Locations'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Application Deadline: {deadline}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Link to={`/student/resume/match?driveId=${drive._id}`}>
            <Button variant="outline" size="sm" icon={Sparkles} className="w-full sm:w-auto">
              Match Resume
            </Button>
          </Link>
          <Link to={`/student/drives/${drive._id}/eligibility`}>
            <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto">
              Check Eligibility & Apply
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Job Description & Eligibility Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description & Selection Process */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-3">
              Role & Responsibility Overview
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {drive.jobDescription}
            </p>

            {drive.requiredSkills && drive.requiredSkills.length > 0 && (
              <>
                <h3 className="text-xs font-bold text-slate-900 mt-5 mb-2.5">
                  Required Technical Skills:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {drive.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {drive.rounds && drive.rounds.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
                Selection Process & Rounds
              </h2>
              <div className="space-y-4">
                {drive.rounds.map((round, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {round.roundNumber || idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{round.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {round.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Eligibility Criteria */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
              Eligibility Criteria
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Package CTC</span>
                <span className="font-bold text-emerald-600 text-sm">₹ {pkg} LPA</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Minimum CGPA</span>
                <span className="font-bold text-slate-800">{drive.minimumCGPA}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Max Backlogs</span>
                <span className="font-bold text-slate-800">{drive.maximumBacklogs}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Graduation Batch</span>
                <span className="font-bold text-slate-800">{drive.graduationYear}</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 block mb-1">Eligible Branches:</span>
                <div className="flex flex-wrap gap-1">
                  {(drive.eligibleBranches || []).map((b) => (
                    <span key={b} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
