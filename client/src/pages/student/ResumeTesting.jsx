import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { resumesApi } from '../../services/api';
import Button from '../../components/common/Button';

export default function ResumeTesting() {
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await resumesApi.test();
      if (res.success && res.data) {
        setTestResult(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to run resume analysis. Ensure you have uploaded an active resume.');
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-indigo-600" />
            Resume Testing & ATS Analysis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic rule-based ATS evaluation for section completeness and keyword density
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          loading={analyzing}
          onClick={runAnalysis}
        >
          Re-Analyze Active Resume
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Link to="/student/resume/upload">
            <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 bg-white">
              Go to Resume Upload
            </Button>
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Extracting PDF text & running ATS rules...</p>
        </div>
      ) : testResult ? (
        <>
          {/* Score Overview Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Circular Score Badge */}
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-400 text-3xl font-extrabold text-emerald-300 shrink-0 shadow-lg shadow-emerald-500/20">
                {testResult.overallScore || 0}
                <span className="text-xs text-emerald-200 font-medium absolute -bottom-2 bg-emerald-800 px-2 py-0.5 rounded-full">
                  / 100
                </span>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    ATS Score:{' '}
                    {testResult.overallScore >= 80
                      ? 'Exceptional (Interview Ready)'
                      : testResult.overallScore >= 60
                      ? 'Good (Room for Improvement)'
                      : 'Needs Refinement'}
                  </span>
                </div>
                <h2 className="text-lg font-bold">
                  {testResult.fileName || 'Candidate Resume'}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Rule-based evaluation completed • Keyword Score: {testResult.keywordScore || 0}/100
                </p>
              </div>
            </div>

            <Link to="/student/resume/match">
              <Button variant="emerald" size="md" icon={Sparkles}>
                Match with a Specific Job Drive
              </Button>
            </Link>
          </div>

          {/* Grid: Section Breakdown & Suggestions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Section Scores */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Section Evaluation Scores
              </h3>

              {testResult.sectionScores && (
                <div className="space-y-3">
                  {Object.entries(testResult.sectionScores).map(([key, val]) => {
                    const score = typeof val === 'number' ? val : val.score || 0;
                    const note = typeof val === 'object' ? val.note : '';

                    return (
                      <div
                        key={key}
                        className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 capitalize">
                              {key} Section
                            </h4>
                          </div>
                          {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
                        </div>

                        <div className="w-full sm:w-28 text-right shrink-0">
                          <span className="text-sm font-bold text-slate-900">{score}%</span>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, score)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Detected Skills */}
              {testResult.detectedSkills && testResult.detectedSkills.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-900 mb-3">
                    Detected Technical Skills ({testResult.detectedSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {testResult.detectedSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Suggestions & Missing Sections */}
            <div className="space-y-6">
              {testResult.suggestions && testResult.suggestions.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Recommendations
                  </h3>

                  <div className="space-y-2.5">
                    {testResult.suggestions.map((sug, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Sections Card */}
              {testResult.missingSections && testResult.missingSections.length > 0 && (
                <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-5 text-xs space-y-2">
                  <h4 className="font-bold text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Missing Recommended Sections
                  </h4>
                  <p className="text-slate-600">
                    Adding these sections can increase your ATS score and shortlist probability:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {testResult.missingSections.map((sec) => (
                      <span
                        key={sec}
                        className="bg-white text-amber-800 border border-amber-200 font-semibold px-2 py-0.5 rounded-md text-[11px]"
                      >
                        + {sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <p>No active resume uploaded yet. Upload a PDF resume to test your score.</p>
          <Link to="/student/resume/upload">
            <Button size="sm" variant="primary">
              Upload Resume PDF
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
