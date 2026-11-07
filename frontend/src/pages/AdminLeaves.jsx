import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  CalendarOff,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [toast, setToast] = useState(null);

  // Review modal state
  const [reviewingLeave, setReviewingLeave] = useState(null); // leave object
  const [decision, setDecision] = useState('approved'); // 'approved' | 'rejected'
  const [adminRemarks, setAdminRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leaves/all?status=${statusFilter}`);
      if (res.data.success) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenReview = (leave, action) => {
    setReviewingLeave(leave);
    setDecision(action);
    setAdminRemarks('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewingLeave) return;

    setSubmitting(true);
    try {
      const res = await api.put(`/leaves/${reviewingLeave._id}/review`, {
        status: decision,
        adminRemarks,
      });

      if (res.data.success) {
        showToast(`Leave request ${decision} successfully`);
        setReviewingLeave(null);
        fetchLeaves();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update leave', 'error');
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

      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Leave Approvals</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review employee time-off requests, check balance, and approve or reject
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs">
          {['pending', 'approved', 'rejected', 'all'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Policy Info Strip */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200/80 px-4 py-3 rounded-2xl shadow-xs">
        <span className="text-slate-900 font-extrabold uppercase tracking-wider text-[10px]">Monthly Policy Quotas:</span>
        <span className="bg-amber-50 text-amber-900 border border-amber-200/60 px-2.5 py-0.5 rounded-lg font-bold">Casual: 1 day/mo</span>
        <span className="bg-amber-50 text-amber-900 border border-amber-200/60 px-2.5 py-0.5 rounded-lg font-bold">Sick: 2 days/mo</span>
        <span className="bg-amber-50 text-amber-900 border border-amber-200/60 px-2.5 py-0.5 rounded-lg font-bold">Emergency: 1 day/mo</span>
        <span className="text-slate-400 text-[10px] ml-auto">All quotas automatically refresh on the 1st of every month</span>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Dates</th>
                <th className="py-3.5 px-4">Days</th>
                <th className="py-3.5 px-6">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading leave requests...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No {statusFilter !== 'all' ? statusFilter : ''} leave requests found.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{l.user?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-slate-400">
                        {l.user?.employeeId} • {l.user?.department}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {l.leaveType}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">
                      {l.totalDays} {l.totalDays === 1 ? 'day' : 'days'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                      {l.reason}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      {l.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(l, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReview(l, 'rejected')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Reviewed by {l.reviewedBy?.name || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {decision === 'approved' ? 'Approve' : 'Reject'} Leave Request
              </h3>
              <button
                onClick={() => setReviewingLeave(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div>
                  <span className="font-semibold text-slate-700">Employee: </span>
                  {reviewingLeave.user?.name} ({reviewingLeave.user?.employeeId})
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Dates: </span>
                  {new Date(reviewingLeave.startDate).toLocaleDateString()} to{' '}
                  {new Date(reviewingLeave.endDate).toLocaleDateString()} ({reviewingLeave.totalDays} days)
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Reason: </span>
                  {reviewingLeave.reason}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Remarks / Feedback
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g. Approved. Please ensure handover to team lead..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewingLeave(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`font-bold text-xs px-5 py-2.5 rounded-xl shadow-md text-white transition-colors ${
                    decision === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
                >
                  {submitting
                    ? 'Processing...'
                    : decision === 'approved'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

