import React from 'react';
import { X, ExternalLink, Calendar, Clock, User } from 'lucide-react';

export default function PhotoModal({ photoUrl, title, meta, onClose }) {
  if (!photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100 max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h4 className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
              {title || 'Attendance Verification Selfie'}
            </h4>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-res Image preview */}
        <div className="bg-slate-950 flex items-center justify-center max-h-[60vh] sm:max-h-[460px] overflow-hidden">
          <img
            src={photoUrl}
            alt="Verification photo"
            className="max-h-[60vh] sm:max-h-[460px] w-auto object-contain"
          />
        </div>

        {/* Meta Footer */}
        {meta && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            {meta.employee && (
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                {meta.employee} ({meta.employeeId})
              </span>
            )}
            {meta.time && (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(meta.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            {meta.date && (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {meta.date}
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

