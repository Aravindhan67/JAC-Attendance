import React from 'react';

export default function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();

  switch (norm) {
    case 'present':
    case 'active':
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2ECE6] text-[#1B3B34] border border-[#BCD3C5]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B3B34]" />
          {norm === 'active' ? 'Active' : norm === 'approved' ? 'Approved' : 'Present'}
        </span>
      );

    case 'late':
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F6EFE2] text-[#8A5C1E] border border-[#E5D3B8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B88B42]" />
          {norm === 'pending' ? 'Pending' : 'Late'}
        </span>
      );

    case 'half-day':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F7EDE4] text-[#965427] border border-[#E8D0BD]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C25E37]" />
          Half-Day
        </span>
      );

    case 'absent':
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F8ECE9] text-[#9E3C26] border border-[#EAC5BD]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C25E37]" />
          {norm === 'rejected' ? 'Rejected' : 'Absent'}
        </span>
      );

    case 'leave':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8EDEE] text-[#2C4E55] border border-[#CAD8DB]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3F6C75]" />
          On Leave
        </span>
      );

    case 'inactive':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAE4D6] text-[#5A5347] border border-[#DCD4C4]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8A8274]" />
          Inactive
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#EAE4D6] text-[#23201B] border border-[#DCD4C4]">
          {status || 'N/A'}
        </span>
      );
  }
}
