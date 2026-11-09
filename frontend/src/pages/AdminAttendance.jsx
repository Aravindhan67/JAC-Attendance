import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PhotoModal from '../components/PhotoModal';
import IndividualReportModal from '../components/IndividualReportModal';
import {
  Calendar,
  Search,
  Filter,
  Download,
  Camera,
  CheckCircle2,
  Clock,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Edit3,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [notification, setNotification] = useState(null);
  const [reportModal, setReportModal] = useState({ isOpen: false, employee: null });

  // Review & Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    record: null,
    actionType: 'approve', // 'approve' | 'reject'
    adminRemark: '',
    submitting: false,
  });

  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = `/attendance/all?date=${dateFilter}`;
      if (departmentFilter && departmentFilter !== 'All') {
        url += `&department=${encodeURIComponent(departmentFilter)}`;
      }
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      if (search) {
        url += `&employeeId=${encodeURIComponent(search)}`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await api.get('/attendance/regularize/pending');
      if (res.data.success) {
        setPendingRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load pending regularization requests', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchPendingRequests();
  }, [dateFilter, departmentFilter, statusFilter]);

  const handleOpenActionModal = (record, actionType) => {
    setActionModal({
      isOpen: true,
      record,
      actionType,
      adminRemark:
        actionType === 'approve'
          ? (record.status === 'late' ? 'Late arrival approved by Admin' : 'Approved by Admin')
          : '',
      submitting: false,
    });
  };

  const handleConfirmAction = async () => {
    const { record, actionType, adminRemark } = actionModal;
    if (!record) return;

    if (actionType === 'reject' && !adminRemark.trim()) {
      showToast('Please provide a reason or note for rejecting this punch.', 'error');
      return;
    }

    setActionModal((prev) => ({ ...prev, submitting: true }));

    try {
      // Check if this record is a pending regularization request
      if (record.approvalStatus === 'pending') {
        const res = await api.put(`/attendance/regularize/${record._id}/review`, {
          status: actionType === 'approve' ? 'approved' : 'rejected',
          adminRemarks: adminRemark || (actionType === 'approve' ? 'Approved by Admin' : 'Rejected by Admin'),
        });
        if (res.data.success) {
          showToast(res.data.message || `Punch request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully.`);
        }
      } else {
        // Direct row-level action (e.g. approving a Late punch or rejecting a punch)
        const newStatus = actionType === 'approve' ? 'present' : 'absent';
        const res = await api.put(`/attendance/${record._id}`, {
          status: newStatus,
          approvalStatus: actionType === 'approve' ? 'approved' : 'rejected',
          adminRemark: adminRemark || (actionType === 'approve' ? 'Approved by Admin' : 'Rejected by Admin'),
        });
        if (res.data.success) {
          showToast(
            actionType === 'approve'
              ? `Attendance for ${record.user?.name || 'Employee'} approved as Present.`
              : `Attendance for ${record.user?.name || 'Employee'} rejected and marked as Absent.`
          );
        }
      }

      setActionModal({ isOpen: false, record: null, actionType: 'approve', adminRemark: '', submitting: false });
      fetchAttendance();
      fetchPendingRequests();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Action failed', 'error');
      setActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAttendance();
  };

  // CSV Export feature
  const exportToCSV = () => {
    if (!records.length) {
      alert('No records available to export.');
      return;
    }

    const headers = [
      'Date',
      'Employee ID',
      'Employee Name',
      'Department',
      'Designation',
      'Status',
      'Work Mode',
      'Clock In Time',
      'Clock Out Time',
      'Total Hours',
      'Note / Remark',
    ];

    const rows = records.map((r) => [
      r.date,
      r.user?.employeeId || '',
      `"${r.user?.name || ''}"`,
      `"${r.user?.department || ''}"`,
      `"${r.user?.designation || ''}"`,
      r.status,
      r.clockIn?.location || 'Office',
      r.clockIn?.timestamp ? new Date(r.clockIn.timestamp).toLocaleTimeString() : '',
      r.clockOut?.timestamp ? new Date(r.clockOut.timestamp).toLocaleTimeString() : '',
      r.totalHours || 0,
      `"${(r.clockIn?.note || r.adminRemark || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_report_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold transition-all transform animate-bounce ${
            notification.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-500/50'
              : 'bg-zinc-950 text-amber-300 border-amber-400/50'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Attendance Master Sheet</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit daily employee punches, verification selfies, and export individual employee Excel reports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Individual Employee Excel Report Generator */}
          <button
            type="button"
            onClick={() => setReportModal({ isOpen: true, employee: null })}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-900/10 flex items-center gap-2 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            Individual Excel Report
          </button>

          {/* Daily CSV Export */}
          <button
            type="button"
            onClick={exportToCSV}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-slate-300" />
            Export Daily CSV
          </button>
        </div>
      </div>

      {/* Pending Punch Regularization Approvals (Late Check-In / Forgot Check-Out) */}
      {pendingRequests.length > 0 ? (
        <div className="bg-gradient-to-r from-neutral-950 via-zinc-950 to-neutral-900 border-2 border-amber-400/40 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Pending Punch Regularization Requests ({pendingRequests.length})
              </h2>
            </div>
            <span className="text-[11px] text-amber-300 font-semibold bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/30">
              Auto checks-in / out upon approval
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => {
              const reqData = req.pendingRequest;
              return (
                <div
                  key={req._id}
                  className="bg-zinc-900/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-inner"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-black text-sm shrink-0">
                        {req.user?.name ? req.user.name.charAt(0) : 'E'}
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">{req.user?.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {req.user?.employeeId} • {req.user?.department}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {reqData?.requestType}
                    </span>
                  </div>

                  <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Date: <strong className="text-white">{req.date}</strong></span>
                      <span>
                        Time:{' '}
                        <strong className="text-white">
                          {reqData?.requestedAt ? new Date(reqData.requestedAt).toLocaleTimeString() : '—'}
                        </strong>
                      </span>
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-400 font-semibold">Reason:</span>{' '}
                      {reqData?.note || 'No explanation note provided'}
                    </div>
                    {reqData?.photo && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPhoto({
                              url: reqData.photo,
                              title: `${reqData.requestType} Selfie — ${req.user?.name}`,
                              employee: req.user?.name,
                              employeeId: req.user?.employeeId,
                              time: reqData.requestedAt,
                              date: req.date,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold text-[11px] transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Inspect Selfie Photo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleOpenActionModal(req, 'reject')}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenActionModal(req, 'approve')}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      Approve & Auto {reqData?.requestType?.includes('Check-Out') ? 'Check Out' : 'Check In'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Punch Regularization Status:</span>
            <span>All Late & Forgot punch requests are reviewed (0 pending)</span>
          </div>
          <button
            type="button"
            onClick={fetchPendingRequests}
            disabled={loadingRequests}
            className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin' : ''}`} />
            Refresh Requests
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs flex-1 sm:flex-initial">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer w-full"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs flex-1 sm:flex-initial">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer w-full"
            >
              <option value="All">All Departments</option>
              <option value="Full Stack Development">Full Stack Development</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Frontend Development">Frontend Development</option>
              <option value="Backend Development">Backend Development</option>
              <option value="Mobile App Development">Mobile App Development</option>
              <option value="QA & Testing">QA & Testing</option>
              <option value="DevOps & Cloud">DevOps & Cloud</option>
              <option value="IT & Tech Support">IT & Tech Support</option>
              <option value="Administration">Administration</option>
              <option value="Project Management">Project Management</option>
              <option value="Digital Marketing">Digital Marketing</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer flex-1 sm:flex-initial"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half-day">Half-Day</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {/* Employee Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-56"
            />
          </div>
          <button
            type="submit"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

      {/* Master Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Clock In</th>
                <th className="py-3.5 px-4">Clock Out</th>
                <th className="py-3.5 px-4">Hours</th>
                <th className="py-3.5 px-4 text-center">Verification Selfie</th>
                <th className="py-3.5 px-6">Notes</th>
                <th className="py-3.5 px-6 text-right font-black text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No attendance records found matching filters for {dateFilter}.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isLate = r.status === 'late';
                  const isPending = r.approvalStatus === 'pending';
                  const isApproved = r.approvalStatus === 'approved' || (r.status === 'present' && r.adminRemark?.includes('Approved'));
                  const isAbsent = r.status === 'absent' || r.approvalStatus === 'rejected';

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-800">{r.user?.name || 'Unknown'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {r.user?.employeeId || '—'}
                            </div>
                          </div>
                          {r.user && (
                            <button
                              type="button"
                              title={`Generate Individual Excel Report for ${r.user.name}`}
                              onClick={() => setReportModal({ isOpen: true, employee: r.user })}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        <div>{r.user?.department || 'General'}</div>
                        <div className="text-[10px] text-slate-400">{r.user?.designation}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={r.status} />
                          {r.clockIn?.location && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {r.clockIn.location}
                            </span>
                          )}
                          {r.approvalStatus === 'approved' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <ShieldCheck className="w-2.5 h-2.5" /> Approved
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-mono font-medium">
                        {r.clockIn?.timestamp
                          ? new Date(r.clockIn.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-mono font-medium">
                        {r.clockOut?.timestamp
                          ? new Date(r.clockOut.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {r.totalHours > 0 ? `${r.totalHours} hrs` : '—'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {r.clockIn?.photo ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPhoto({
                                url: r.clockIn.photo,
                                title: `Clock-In Selfie — ${r.user?.name}`,
                                employee: r.user?.name,
                                employeeId: r.user?.employeeId,
                                time: r.clockIn.timestamp,
                                date: r.date,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border border-amber-300/40 font-semibold text-[11px] transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            View Photo
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Photo</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        <div className="flex flex-col gap-1 items-start">
                          {((r.exceptionType && r.exceptionType !== 'none') ||
                            (r.clockIn?.punchType && r.clockIn.punchType !== 'Regular')) && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300">
                              {r.exceptionType && r.exceptionType !== 'none'
                                ? r.exceptionType
                                : r.clockIn?.punchType}
                            </span>
                          )}
                          <span className="truncate max-w-xs">{r.clockIn?.note || r.adminRemark || '—'}</span>
                        </div>
                      </td>
                      
                      {/* ACTIONS COLUMN: Approve & Reject Options */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* When record is Late or Pending: Show distinct Approve and Reject buttons */}
                          {isLate || isPending ? (
                            <>
                              <button
                                type="button"
                                title="Approve this punch (regularize as present)"
                                onClick={() => handleOpenActionModal(r, 'approve')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-[11px] shadow-sm transition-all active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                Approve
                              </button>
                              <button
                                type="button"
                                title="Reject punch (mark as absent)"
                                onClick={() => handleOpenActionModal(r, 'reject')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-all active:scale-95"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                Reject
                              </button>
                            </>
                          ) : isAbsent ? (
                            <>
                              <button
                                type="button"
                                title="Re-approve this employee's attendance as Present"
                                onClick={() => handleOpenActionModal(r, 'approve')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>
                            </>
                          ) : (
                            /* Already Present or Regular: allow Quick Status Revision if needed */
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Verified
                              </span>
                              <button
                                type="button"
                                title="Change status or mark absent"
                                onClick={() => handleOpenActionModal(r, 'reject')}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Action Confirmation Modal */}
      {actionModal.isOpen && actionModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div
              className={`p-5 flex items-center justify-between text-white ${
                actionModal.actionType === 'approve'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                  : 'bg-gradient-to-r from-rose-600 to-red-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {actionModal.actionType === 'approve' ? (
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <AlertCircle className="w-6 h-6 stroke-[2.5]" />
                )}
                <div>
                  <h3 className="font-black text-base">
                    {actionModal.actionType === 'approve'
                      ? 'Approve Attendance Record'
                      : 'Reject Attendance Record'}
                  </h3>
                  <p className="text-white/80 text-[11px]">
                    {actionModal.actionType === 'approve'
                      ? 'Authorize and regularize punch as Present'
                      : 'Disallow punch and mark as Absent'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActionModal({ isOpen: false, record: null, actionType: 'approve', adminRemark: '', submitting: false })
                }
                className="p-1 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              
              {/* Employee Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    {actionModal.record.user?.name}
                  </span>
                  <span className="font-mono text-slate-500 font-semibold text-[11px]">
                    {actionModal.record.user?.employeeId}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Date</span>
                    <strong className="text-slate-700">{actionModal.record.date}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Clock In</span>
                    <strong className="text-slate-700">
                      {actionModal.record.clockIn?.timestamp
                        ? new Date(actionModal.record.clockIn.timestamp).toLocaleTimeString()
                        : '—'}
                    </strong>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
                  <span className="text-slate-500 font-semibold">Status Change:</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 capitalize">
                      {actionModal.record.status}
                    </span>
                    <span>➔</span>
                    <span
                      className={`px-2 py-0.5 rounded font-black uppercase text-[10px] ${
                        actionModal.actionType === 'approve'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {actionModal.actionType === 'approve' ? 'Present (Approved)' : 'Absent (Rejected)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks / Reason Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                  <span>
                    Admin Remarks {actionModal.actionType === 'reject' ? '(Required)' : '(Optional)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Visible on employee records
                  </span>
                </label>
                <textarea
                  rows="3"
                  value={actionModal.adminRemark}
                  onChange={(e) =>
                    setActionModal((prev) => ({ ...prev, adminRemark: e.target.value }))
                  }
                  placeholder={
                    actionModal.actionType === 'approve'
                      ? 'e.g. Late arrival accepted due to client visit / traffic'
                      : 'e.g. Unauthorized late arrival exceeding permissible grace period'
                  }
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 resize-none font-medium"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionModal.submitting}
                  onClick={() =>
                    setActionModal({ isOpen: false, record: null, actionType: 'approve', adminRemark: '', submitting: false })
                  }
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionModal.submitting}
                  onClick={handleConfirmAction}
                  className={`px-5 py-2 rounded-xl text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 ${
                    actionModal.actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
                >
                  {actionModal.submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : actionModal.actionType === 'approve' ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <X className="w-4 h-4 stroke-[3]" />
                  )}
                  {actionModal.submitting
                    ? 'Processing...'
                    : actionModal.actionType === 'approve'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Individual Employee Excel Report Modal */}
      {reportModal.isOpen && (
        <IndividualReportModal
          isOpen={reportModal.isOpen}
          initialEmployee={reportModal.employee}
          onClose={() => setReportModal({ isOpen: false, employee: null })}
        />
      )}

      {/* Photo Inspector Modal */}
      {selectedPhoto && (
        <PhotoModal
          photoUrl={selectedPhoto.url}
          title={selectedPhoto.title}
          meta={{
            employee: selectedPhoto.employee,
            employeeId: selectedPhoto.employeeId,
            time: selectedPhoto.time,
            date: selectedPhoto.date,
          }}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

    </div>
  );
}
