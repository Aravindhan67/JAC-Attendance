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
          <h1 className="text-2xl font-black text-slate-800">My Leave Applications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Apply for planned leaves and track manager approval status
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all self-start sm:self-auto uppercase tracking-wider"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Apply for Leave
        </button>
      </div>

      {/* Monthly Leave Allowance Cards - Refreshes on 1st of every month */}
      {monthlyQuota?.quotas && (
        <div className="bg-gradient-to-r from-neutral-950 via-zinc-950 to-neutral-900 p-5 sm:p-6 rounded-3xl border border-amber-500/30 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-400/30">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Monthly Quota • {monthlyQuota.month}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-1.5 tracking-tight">
                Monthly Leave Allowance
              </h2>
            </div>
            <div className="text-[11px] text-amber-300/90 font-semibold bg-amber-400/10 px-3.5 py-1.5 rounded-xl border border-amber-400/25 self-start sm:self-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Refreshes on the 1st of every month</span>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
            {/* Casual Leave */}
            <div className="bg-black/60 border border-white/10 hover:border-amber-400/40 rounded-2xl p-4 transition-all shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Casual Leave (CL)</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  1 Day / Mo
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-amber-400">
                  {monthlyQuota.quotas['Casual Leave']?.remaining ?? 1}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  / {monthlyQuota.quotas['Casual Leave']?.limit ?? 1} day left
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Used: <span className="font-bold text-white">{monthlyQuota.quotas['Casual Leave']?.used ?? 0} day</span>
              </div>
            </div>

            {/* Sick Leave */}
            <div className="bg-black/60 border border-white/10 hover:border-amber-400/40 rounded-2xl p-4 transition-all shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Sick Leave (SL)</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  2 Days / Mo
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-amber-400">
                  {monthlyQuota.quotas['Sick Leave']?.remaining ?? 2}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  / {monthlyQuota.quotas['Sick Leave']?.limit ?? 2} days left
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Used: <span className="font-bold text-white">{monthlyQuota.quotas['Sick Leave']?.used ?? 0} days</span>
              </div>
            </div>

            {/* Emergency Leave */}
            <div className="bg-black/60 border border-white/10 hover:border-amber-400/40 rounded-2xl p-4 transition-all shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Emergency Leave</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  1 Day / Mo
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-amber-400">
                  {monthlyQuota.quotas['Emergency Leave']?.remaining ?? 1}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  / {monthlyQuota.quotas['Emergency Leave']?.limit ?? 1} day left
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Used: <span className="font-bold text-white">{monthlyQuota.quotas['Emergency Leave']?.used ?? 0} day</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">{stats.pending}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Approved Requests</span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{stats.approved}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Days Approved</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">{stats.totalDaysApproved} days</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Rejected</span>
            <div className="text-xl font-black text-rose-600 mt-0.5">{stats.rejected}</div>
          </div>
        </div>
      )}

      {/* Leaves History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Leave Type</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Days</th>
                <th className="py-3.5 px-6">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6">Admin Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading leave requests...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No leave applications yet. Click "Apply for Leave" above.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {l.leaveType}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {l.totalDays} {l.totalDays === 1 ? 'day' : 'days'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                      {l.reason}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-4 px-6 text-slate-500 italic">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <CalendarOff className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Apply for Leave</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleApplyLeave} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Leave Type
                  </label>
                  <span className="text-[10px] text-amber-700 font-bold">
                    Quota resets monthly
                  </span>
                </div>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the purpose of your leave request..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/25 flex items-center gap-2 uppercase tracking-wider"
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

