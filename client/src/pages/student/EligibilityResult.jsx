import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { drivesApi, applicationsApi } from '../../services/api';
import Button from '../../components/common/Button';

export default function EligibilityResult() {
  const { driveId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [drive, setDrive] = useState(null);
  const [error, setError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchEligibility = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eligRes, driveRes] = await Promise.all([
          drivesApi.checkEligibility(driveId),
          drivesApi.getById(driveId),
        ]);

        if (!isMounted) return;

        if (eligRes.success) {
          setEvaluation(eligRes.data);
        }
        if (driveRes.success) {
          setDrive(driveRes.data);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to evaluate eligibility');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (driveId) fetchEligibility();
    return () => {
      isMounted = false;
    };
  }, [driveId]);

  const handleApply = async () => {
    setApplying(true);
    setError(null);
    try {
      const res = await applicationsApi.apply(driveId);
      if (res.success) {
        setApplySuccess(true);
        setTimeout(() => {
          navigate('/student/applications');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEligible = evaluation?.eligible;
  const compName = drive?.company?.name || drive?.company?.companyName || 'Corporate Partner';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          to={`/student/drives/${driveId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Drive Details</span>
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Status Banner */}
      <div
        className={`rounded-2xl border p-6 text-center ${
          isEligible
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/70 border-rose-200 text-rose-950'
        }`}
      >
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3">
          {isEligible ? (
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold tracking-tight">
          {isEligible ? 'You Are Eligible to Apply!' : 'Eligibility Criteria Not Met'}
        </h1>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
          {isEligible
            ? `Your verified academic profile meets the requirements for ${compName}.`
            : `One or more eligibility constraints for ${compName} do not match your current record.`}
        </p>

        {isEligible && (
          <div className="mt-5">
            {applySuccess ? (
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-white px-4 py-2 rounded-xl border border-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                Application Submitted! Redirecting to tracker...
              </div>
            ) : (
              <Button
                variant="emerald"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                loading={applying}
                onClick={handleApply}
              >
                Submit Official Application
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Criteria Breakdown Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Detailed Criteria Evaluation
        </h2>

        {/* Failed Criteria if any */}
        {evaluation?.failedCriteria && evaluation.failedCriteria.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Failed Checks ({evaluation.failedCriteria.length})
            </h3>
            {evaluation.failedCriteria.map((fail, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/50 border border-rose-200"
              >
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-900 font-medium">{fail}</p>
              </div>
            ))}
          </div>
        )}

        {/* Matched Criteria */}
        {evaluation?.matchedCriteria && evaluation.matchedCriteria.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Passed Checks ({evaluation.matchedCriteria.length})
            </h3>
            {evaluation.matchedCriteria.map((match, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/40 border border-emerald-100"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700">{match}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
