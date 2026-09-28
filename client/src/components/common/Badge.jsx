import React from 'react';

/**
 * Reusable Badge component for statuses, tags, and categories
 */
export default function Badge({ children, variant = 'neutral', size = 'md', className = '' }) {
  const variantStyles = {
    // Application, Interview & Result Statuses
    SELECTED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    PLACED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    CLEARED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    SHORTLISTED: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
    APPLIED: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
    SCHEDULED: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20',
    RESCHEDULED: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    ASSESSMENT: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    WAITLISTED: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    WITHDRAWN: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-400/20',

    // Drive Statuses
    OPEN: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-500/20',
    UPCOMING: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-400/20',
    COMPLETED: 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-500/20',

    // Categories & Priorities
    SUPERDREAM: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20 font-semibold',
    DREAM: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20 font-medium',
    NORMAL: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-400/20',
    URGENT: 'bg-red-50 text-red-700 border-red-200 ring-red-500/20 animate-pulse',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20',
    MEDIUM: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-400/20',
    LOW: 'bg-slate-50 text-slate-500 border-slate-200 ring-slate-300/20',
    IMPORTANT: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    RECRUITMENT: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
    INTERVIEW: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20',
    RESULT: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    COMPANY: 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-500/20',
    GENERAL: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-400/20',

    // Generic
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const key = String(variant).toUpperCase();
  const selectedStyle = variantStyles[key] || variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ring-1 ring-inset ${selectedStyle} ${sizeStyles[size]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
