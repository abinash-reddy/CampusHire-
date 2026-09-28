import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Download, Building2, Calendar, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { resultsApi } from '../../services/api';

export default function PlacementHistory() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await resultsApi.getMy();
      if (res.success) {
        setResults(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch placement history:', err);
      setError(err.message || 'Unable to load placement records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-indigo-600" />
            My Placement Record & Offers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official recruitment offers recorded with the University Training & Placement Cell
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchResults} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading placement records...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Placement Offers Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once interview rounds conclude and final placement results are published by the TPO cell, your verified offer letters will appear here.
          </p>
        </div>
      ) : (
        /* Offer Cards */
        <div className="space-y-4">
          {results.map((offer) => {
            const companyName = offer.company?.name || offer.company || 'Recruiting Partner';
            const roleName = offer.jobRole || offer.recruitmentDrive?.jobTitle || 'Graduate Trainee';
            const formattedDate = offer.resultDate
              ? new Date(offer.resultDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'N/A';

            return (
              <div
                key={offer._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {companyName}
                        </h3>
                        {offer.recruitmentDrive?.tier && (
                          <Badge variant={offer.recruitmentDrive.tier}>
                            {offer.recruitmentDrive.tier}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{roleName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={offer.status}>{offer.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Offered Compensation</span>
                    <span className="text-base font-extrabold text-emerald-600">
                      ₹ {offer.package || 'Confidential'} {offer.package ? 'LPA' : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Result Published On</span>
                    <span className="font-semibold text-slate-800">{formattedDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Verification</span>
                    <span className="font-semibold text-indigo-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      TPO Certified
                    </span>
                  </div>
                </div>

                {offer.remarks && (
                  <p className="text-xs text-slate-500 italic">
                    Note: {offer.remarks}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
