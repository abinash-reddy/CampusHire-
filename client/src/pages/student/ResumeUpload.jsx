import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  CheckCircle2,
  FileCheck2,
  Trash2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { resumesApi } from '../../services/api';
import Button from '../../components/common/Button';

export default function ResumeUpload() {
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const fetchResume = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resumesApi.getMy();
      if (res.success && res.data) {
        setActiveResume(res.data);
      } else {
        setActiveResume(null);
      }
    } catch (err) {
      if (err.status !== 404) {
        setError(err.message || 'Failed to fetch resume');
      }
      setActiveResume(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResume();
  }, []);

  const triggerBrowse = (e) => {
    if (e) {
      e.stopPropagation();
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files (.pdf) are accepted for resume upload');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit. Please upload a smaller PDF.');
      return;
    }

    setUploading(true);
    setUploadingFileName(file.name);
    setError(null);
    setMessage(null);

    try {
      const res = await resumesApi.upload(file);
      if (res.success && res.data) {
        setActiveResume(res.data);
        setMessage(`Resume "${file.name}" uploaded and set as active successfully!`);
        setTimeout(() => setMessage(null), 5000);
      } else {
        throw new Error(res.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload resume PDF');
    } finally {
      setUploading(false);
      setUploadingFileName('');
    }
  };

  const handleDelete = async () => {
    if (!activeResume?._id) return;
    if (!window.confirm('Are you sure you want to remove your active resume?')) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await resumesApi.delete(activeResume._id);
      if (res.success) {
        setActiveResume(null);
        setMessage('Resume removed successfully');
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete resume');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        disabled={uploading}
        onChange={handleFileChange}
        onClick={(e) => {
          e.target.value = null;
        }}
        className="hidden"
        id="resume-file-input"
      />

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-indigo-600" />
          Resume Studio & PDF Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload and maintain your active placement resume. Drives automatically read from your active resume.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Resume Card */}
      {loading ? (
        <div className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      ) : activeResume ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-sm">
                  {activeResume.fileName || activeResume.originalName || 'Active Resume.pdf'}
                </h3>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {(activeResume.fileSize ? activeResume.fileSize / (1024 * 1024) : 0).toFixed(2)} MB • Uploaded on{' '}
                {new Date(activeResume.createdAt || Date.now()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Link to="/student/resume/test">
              <Button variant="emerald" size="sm" icon={FileCheck2}>
                Test ATS Score
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={triggerBrowse}
              disabled={uploading}
            >
              Replace
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              loading={deleting}
              onClick={handleDelete}
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
            >
              Delete
            </Button>
          </div>
        </div>
      ) : null}

      {/* Drag & Drop Upload Zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={triggerBrowse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerBrowse();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all bg-white cursor-pointer select-none outline-hidden ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/30 ring-4 ring-indigo-500/10'
            : 'border-slate-200/90 hover:border-indigo-400 hover:bg-slate-50/50'
        }`}
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
          <Upload className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-slate-900">
          {activeResume ? 'Replace Active Resume PDF' : 'Upload New Resume PDF'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Drag and drop your latest PDF resume here, or click anywhere to browse from your device.
        </p>

        {uploading && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Uploading {uploadingFileName || 'resume'}...</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center">
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={Upload}
            loading={uploading}
            disabled={uploading}
            onClick={triggerBrowse}
          >
            {uploading ? 'Uploading PDF...' : 'Browse Files (PDF Only, Max 5MB)'}
          </Button>
        </div>
      </div>

      {/* Guidelines Card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-600" />
          Campus Placement Resume Guidelines:
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
          <li>Only PDF documents under 5MB are accepted.</li>
          <li>Ensure readable text formatting (avoid scanned image-only PDFs) for ATS keyword parsers.</li>
          <li>Include contact links: College Email, Phone, GitHub, and LinkedIn profile.</li>
        </ul>
      </div>
    </div>
  );
}
