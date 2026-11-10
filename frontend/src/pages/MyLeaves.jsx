import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  CalendarOff,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [monthlyQuota, setMonthlyQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves/my-leaves');
      if (res.data.success) {
        setLeaves(res.data.data);
        setStats(res.data.stats);
        if (res.data.monthlyQuota) {
          setMonthlyQuota(res.data.monthlyQuota);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!startDate || !endDate || !reason.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    // Client-side quota pre-check
    if (monthlyQuota?.quotas?.[leaveType]) {
      const quota = monthlyQuota.quotas[leaveType];
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const requestedDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (requestedDays > quota.remaining) {
        setFormError(
          `Monthly limit exceeded for ${leaveType}. You have ${quota.remaining} day(s) remaining for ${monthlyQuota.month} (Limit: ${quota.limit} day(s)/month). Allowance refreshes next month.`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.post('/leaves', {
        leaveType,
        startDate,
        endDate,
        reason,
      });

      if (res.data.success) {
        showToast('Leave request submitted successfully!');
        setIsModalOpen(false);
        setReason('');
        setStartDate('');
        setEndDate('');
        fetchLeaves();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold shadow-lg transition-all animate-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white shadow-rose-200'
              : 'bg-emerald-600 text-white shadow-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="opacity-80 hover:opacity-100 text-base">✕</button>
        </div>
      )}

      {/* Header & Apply Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1B3B34] tracking-tight">My Leave Applications</h1>
          <p className="text-xs text-[#5A5347] mt-0.5 font-medium">
            Apply for planned leaves and track manager approval status
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-[#C25E37] hover:bg-[#AA4F2C] text-[#FAF6EE] text-xs font-bold px-5 py-2.5 rounded-xl shadow-warm-sm flex items-center gap-2 transition-all self-start sm:self-auto border border-[#A74E2B] active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Apply for Leave
        </button>
      </div>

      {/* Monthly Leave Allowance Cards - Refreshes on 1st of every month */}
      {monthlyQuota?.quotas && (
        <div className="bg-[#FAF6EE] p-5 sm:p-6 rounded-3xl border border-[#DCD4C4] shadow-warm-sm text-[#23201B] relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCD4C4]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2ECE6] text-[#1B3B34] text-[10px] font-extrabold uppercase tracking-wider border border-[#BCD3C5]">
                <Sparkles className="w-3 h-3 text-[#C25E37]" />
                <span>Monthly Quota • {monthlyQuota.month}</span>
              </div>
              <h2 className="text-lg font-black text-[#1B3B34] mt-1.5 tracking-tight">
                Monthly Leave Allowance
              </h2>
            </div>
            <div className="text-[11px] text-[#8F5413] font-bold bg-[#F6EFE2] px-3.5 py-1.5 rounded-xl border border-[#DFCBB5] self-start sm:self-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C25E37]" />
              <span>Refreshes on the 1st of every month</span>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
            {/* Casual Leave */}
            <div className="bg-[#EAE4D6]/70 border border-[#DCD4C4] rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5A5347]">Casual Leave (CL)</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-[#FAF6EE] text-[#1B3B34] border border-[#DCD4C4]">
                  1 Day / Mo
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-[#1B3B34]">
                  {monthlyQuota.quotas['Casual Leave']?.remaining ?? 1}
                </span>
                <span className="text-xs font-semibold text-[#5A5347]">
                  / {monthlyQuota.quotas['Casual Leave']?.limit ?? 1} day left
                </span>
              </div>
              <div className="mt-2 text-[11px] text-[#5A5347]">
                Used: <span className="font-bold text-[#23201B]">{monthlyQuota.quotas['Casual Leave']?.used ?? 0} day</span>
              </div>
            </div>

            {/* Sick Leave */}
            <div className="bg-[#EAE4D6]/70 border border-[#DCD4C4] rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5A5347]">Sick Leave (SL)</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-[#FAF6EE] text-[#1B3B34] border border-[#DCD4C4]">
                  2 Days / Mo
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-[#1B3B34]">
                  {monthlyQuota.quotas['Sick Leave']?.remaining ?? 2}
                </span>
                <span className="text-xs font-semibold text-[#5A5347]">
                  / {monthlyQuota.quotas['Sick Leave']?.limit ?? 2} days left
                </span>
              </div>
              <div className="mt-2 text-[11px] text-[#5A5347]">
                Used: <span className="font-bold text-[#23201B]">{monthlyQuota.quotas['Sick Leave']?.used ?? 0} days</span>
              </div>
            </div>

            {/* Emergency Leave */}
            <div className="bg-[#EAE4D6]/70 border border-[#DCD4C4] rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5A5347]">Emergency Leave</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-[#FAF6EE] text-[#1B3B34] border border-[#DCD4C4]">
                  1 Day / Mo
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-[#1B3B34]">
                  {monthlyQuota.quotas['Emergency Leave']?.remaining ?? 1}
                </span>
                <span className="text-xs font-semibold text-[#5A5347]">
                  / {monthlyQuota.quotas['Emergency Leave']?.limit ?? 1} day left
                </span>
              </div>
              <div className="mt-2 text-[11px] text-[#5A5347]">
                Used: <span className="font-bold text-[#23201B]">{monthlyQuota.quotas['Emergency Leave']?.used ?? 0} day</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
            <div className="text-xl font-black text-[#9C6500] mt-0.5">{stats.pending}</div>
          </div>
          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Approved Requests</span>
            <div className="text-xl font-black text-[#1B3B34] mt-0.5">{stats.approved}</div>
          </div>
          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Days Approved</span>
            <div className="text-xl font-black text-[#C25E37] mt-0.5">{stats.totalDaysApproved} days</div>
          </div>
          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Rejected</span>
            <div className="text-xl font-black text-[#B84030] mt-0.5">{stats.rejected}</div>
          </div>
        </div>
      )}

      {/* Leaves History Table */}
      <div className="bg-[#FAF6EE] rounded-3xl border border-[#DCD4C4] shadow-warm-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EAE4D6]/70 text-[#5A5347] uppercase tracking-wider text-[10px] font-bold border-b border-[#DCD4C4]">
              <tr>
                <th className="py-3.5 px-6">Leave Type</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Days</th>
                <th className="py-3.5 px-6">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6">Admin Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCD4C4]/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#8A8274]">
                    Loading leave requests...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#8A8274]">
                    No leave applications yet. Click "Apply for Leave" above.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-[#EAE4D6]/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#23201B]">
                      {l.leaveType}
                    </td>
                    <td className="py-4 px-4 text-[#5A5347] font-mono text-[11px]">
                      {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-[#23201B]">
                      {l.totalDays} {l.totalDays === 1 ? 'day' : 'days'}
                    </td>
                    <td className="py-4 px-6 text-[#5A5347] max-w-xs truncate">
                      {l.reason}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-4 px-6 text-[#5A5347] italic">
                      {l.adminRemarks || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23201B]/50 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-[#FAF6EE] rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#DCD4C4] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#DCD4C4] bg-[#FAF6EE] shrink-0">
              <div className="flex items-center gap-2">
                <CalendarOff className="w-5 h-5 text-[#C25E37]" />
                <h3 className="text-base font-bold text-[#1B3B34]">Apply for Leave</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A8274] hover:text-[#23201B] p-1.5 rounded-lg hover:bg-[#EAE4D6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleApplyLeave} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-[#F8ECE9] border border-[#E9C3BC] rounded-xl text-xs text-[#8A2418] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#5A5347]">
                    Leave Type
                  </label>
                  <span className="text-[10px] text-[#8F5413] font-bold">
                    Quota resets monthly
                  </span>
                </div>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37] font-medium"
                >
                  <option value="Casual Leave">
                    Casual Leave (CL) — {monthlyQuota?.quotas?.['Casual Leave']?.remaining ?? 1} day left this month
                  </option>
                  <option value="Sick Leave">
                    Sick Leave (SL) — {monthlyQuota?.quotas?.['Sick Leave']?.remaining ?? 2} days left this month
                  </option>
                  <option value="Emergency Leave">
                    Emergency Leave — {monthlyQuota?.quotas?.['Emergency Leave']?.remaining ?? 1} day left this month
                  </option>
                  <option value="Unpaid Leave">Unpaid Leave (No Quota Limit)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the purpose of your leave request..."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5A5347] hover:text-[#23201B] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#C25E37] hover:bg-[#AA4F2C] disabled:opacity-50 text-[#FAF6EE] font-bold text-xs px-5 py-2.5 rounded-xl shadow-warm-sm flex items-center gap-2 border border-[#A74E2B] transition-all active:scale-95"
                >
                  {submitting ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

