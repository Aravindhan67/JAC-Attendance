import React from 'react';
import { X, ExternalLink, Calendar, Clock, User } from 'lucide-react';
import { getPhotoUrl } from '../api/client';

export default function PhotoModal({ photoUrl, title, meta, onClose }) {
  if (!photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23201B]/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FAF6EE] rounded-3xl shadow-warm-lg max-w-lg w-full overflow-hidden flex flex-col border border-[#DCD4C4] max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#DCD4C4] bg-[#FAF6EE]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C25E37]" />
            <h4 className="font-bold text-[#1B3B34] text-xs sm:text-sm truncate">
              {title || 'Attendance Verification Selfie'}
            </h4>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A8274] hover:text-[#23201B] p-1 rounded-lg hover:bg-[#EAE4D6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-res Image preview */}
        <div className="bg-[#23201B] flex items-center justify-center max-h-[60vh] sm:max-h-[460px] overflow-hidden">
          <img
            src={getPhotoUrl(photoUrl)}
            alt="Verification photo"
            className="max-h-[60vh] sm:max-h-[460px] w-auto object-contain"
          />
        </div>

        {/* Meta Footer */}
        {meta && (
          <div className="px-5 py-3.5 bg-[#FAF6EE] border-t border-[#DCD4C4] flex flex-wrap items-center justify-between text-xs text-[#5A5347] gap-2">
            {meta.employee && (
              <span className="flex items-center gap-1.5 font-bold text-[#1B3B34]">
                <User className="w-3.5 h-3.5 text-[#C25E37]" />
                {meta.employee} ({meta.employeeId})
              </span>
            )}
            {meta.time && (
              <span className="flex items-center gap-1.5 text-[#5A5347] font-medium font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-[#8A8274]" />
                {(() => {
                  try {
                    const d = new Date(meta.time);
                    return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  } catch {
                    return '—';
                  }
                })()}
              </span>
            )}
            {meta.date && (
              <span className="flex items-center gap-1.5 text-[#5A5347] font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#8A8274]" />
                {meta.date}
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

