import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p>© 2026 CampusHire Placement Management System. All rights reserved.</p>
        <p className="text-[11px] text-slate-400">BTWA Capstone Engineering Project</p>
      </div>
    </footer>
  );
}
