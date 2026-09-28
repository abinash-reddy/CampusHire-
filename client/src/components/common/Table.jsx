import React from 'react';

/**
 * Reusable responsive Table component
 */
export default function Table({ headers = [], children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
            {headers.map((header, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-4 py-3 text-[11px] uppercase tracking-wider font-bold text-slate-600"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {children}
        </tbody>
      </table>
    </div>
  );
}
