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
          <h1 className="text-2xl font-black text-[#1B3B34] tracking-tight">Leave Approvals</h1>
          <p className="text-xs text-[#5A5347] mt-0.5 font-medium">
            Review employee time-off requests, check balance, and approve or reject
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#FAF6EE] p-1.5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
          {['pending', 'approved', 'rejected', 'all'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-[#1B3B34] text-[#FAF6EE] shadow-warm-sm'
                  : 'text-[#5A5347] hover:text-[#23201B] hover:bg-[#EAE4D6]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Policy Info Strip */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#5A5347] bg-[#FAF6EE] border border-[#DCD4C4] px-4 py-3 rounded-2xl shadow-warm-sm">
        <span className="text-[#1B3B34] font-black uppercase tracking-wider text-[10px]">Monthly Policy Quotas:</span>
        <span className="bg-[#EAE4D6] text-[#23201B] border border-[#DCD4C4] px-2.5 py-0.5 rounded-lg font-bold">Casual: 1 day/mo</span>
        <span className="bg-[#EAE4D6] text-[#23201B] border border-[#DCD4C4] px-2.5 py-0.5 rounded-lg font-bold">Sick: 2 days/mo</span>
        <span className="bg-[#EAE4D6] text-[#23201B] border border-[#DCD4C4] px-2.5 py-0.5 rounded-lg font-bold">Emergency: 1 day/mo</span>
        <span className="text-[#8A8274] text-[10px] ml-auto">All quotas automatically refresh on the 1st of every month</span>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-[#FAF6EE] rounded-3xl border border-[#DCD4C4] shadow-warm-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EAE4D6]/70 text-[#5A5347] uppercase tracking-wider text-[10px] font-bold border-b border-[#DCD4C4]">
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
            <tbody className="divide-y divide-[#DCD4C4]/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#8A8274]">
                    Loading leave requests...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#8A8274]">
                    No {statusFilter !== 'all' ? statusFilter : ''} leave requests found.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-[#EAE4D6]/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#23201B]">{l.user?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-[#5A5347]">
                        {l.user?.employeeId} • {l.user?.department}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-[#23201B]">
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
                    <td className="py-4 px-6 text-right">
                      {l.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(l, 'approved')}
                            className="bg-[#1B3B34] hover:bg-[#254F46] text-[#FAF6EE] font-bold text-[11px] px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-warm-sm transition-all active:scale-95 border border-[#142C26]"
                          >
                            <Check className="w-3.5 h-3.5 text-[#A9C7B5]" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReview(l, 'rejected')}
                            className="bg-[#F8ECE9] hover:bg-[#F2D7D2] text-[#8A2418] border border-[#E9C3BC] font-bold text-[11px] px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8A8274] italic">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23201B]/50 backdrop-blur-sm p-4">
          <div className="bg-[#FAF6EE] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-[#DCD4C4] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCD4C4] bg-[#FAF6EE]">
              <h3 className="text-base font-bold text-[#1B3B34]">
                {decision === 'approved' ? 'Approve' : 'Reject'} Leave Request
              </h3>
              <button
                onClick={() => setReviewingLeave(null)}
                className="text-[#8A8274] hover:text-[#23201B] p-1.5 rounded-lg hover:bg-[#EAE4D6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div className="p-3.5 bg-[#EAE4D6] rounded-2xl text-xs space-y-1.5 border border-[#DCD4C4]">
                <div>
                  <span className="font-semibold text-[#5A5347]">Employee: </span>
                  <span className="font-bold text-[#23201B]">{reviewingLeave.user?.name} ({reviewingLeave.user?.employeeId})</span>
                </div>
                <div>
                  <span className="font-semibold text-[#5A5347]">Dates: </span>
                  <span className="font-mono text-[#23201B]">{new Date(reviewingLeave.startDate).toLocaleDateString()} to{' '}
                  {new Date(reviewingLeave.endDate).toLocaleDateString()} ({reviewingLeave.totalDays} days)</span>
                </div>
                <div>
                  <span className="font-semibold text-[#5A5347]">Reason: </span>
                  <span className="text-[#23201B]">{reviewingLeave.reason}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                  Admin Remarks / Feedback
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g. Approved. Please ensure handover to team lead..."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewingLeave(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#5A5347] hover:text-[#23201B] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`font-bold text-xs px-5 py-2.5 rounded-xl shadow-warm-sm text-white transition-all active:scale-95 ${
                    decision === 'approved'
                      ? 'bg-[#1B3B34] hover:bg-[#254F46] border border-[#142C26]'
                      : 'bg-[#C25E37] hover:bg-[#AA4F2C] border border-[#A74E2B]'
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

