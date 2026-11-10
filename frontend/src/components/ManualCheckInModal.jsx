import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  X,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

export default function ManualCheckInModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedEmployee = null,
  existingEmployees = [],
  defaultDate = '',
}) {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [date, setDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('09:30');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState('present');
  const [location, setLocation] = useState('Office');
  const [adminRemark, setAdminRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Get today's local date string YYYY-MM-DD
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to deduplicate employee records by _id
  const dedupeEmployees = (list = []) => {
    const map = new Map();
    list.filter(Boolean).forEach((emp) => {
      const id = emp._id || emp.id;
      if (id && !map.has(String(id))) {
        map.set(String(id), emp);
      }
    });
    return Array.from(map.values());
  };

  // Resilient multi-source employee fetching
  const fetchStaff = useCallback(async () => {
    setLoadingEmployees(true);
    let gatheredList = [];

    // 1. Primary endpoint: /employees
    try {
      const res = await api.get('/employees');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        gatheredList = res.data.data;
      } else if (Array.isArray(res.data?.data)) {
        gatheredList = res.data.data;
      } else if (Array.isArray(res.data)) {
        gatheredList = res.data;
      }
    } catch (err) {
      console.warn('Primary /employees fetch notice:', err.message);
    }

    // 2. Secondary fallback if primary is empty: /attendance/today-feed
    if (gatheredList.length === 0) {
      try {
        const feedRes = await api.get('/attendance/today-feed');
        if (feedRes.data?.data && Array.isArray(feedRes.data.data)) {
          const feedStaff = feedRes.data.data.map((r) => r.user).filter(Boolean);
          if (feedStaff.length > 0) {
            gatheredList = feedStaff;
          }
        }
      } catch (feedErr) {
        console.warn('Secondary today-feed fetch notice:', feedErr.message);
      }
    }

    // 3. Tertiary fallback: Merge in existingEmployees from props
    if (existingEmployees && existingEmployees.length > 0) {
      gatheredList = [...gatheredList, ...existingEmployees];
    }

    // 4. Ensure preselected employee is included if present
    if (preselectedEmployee && (preselectedEmployee._id || preselectedEmployee.id)) {
      gatheredList = [preselectedEmployee, ...gatheredList];
    }

    const uniqueEmployees = dedupeEmployees(gatheredList);
    setEmployees(uniqueEmployees);
    setLoadingEmployees(false);

    // Auto-select initial employee
    if (preselectedEmployee?._id || preselectedEmployee?.id) {
      const pId = String(preselectedEmployee._id || preselectedEmployee.id);
      setSelectedUserId(pId);
      if (preselectedEmployee.shiftStartTime) {
        setCheckInTime(preselectedEmployee.shiftStartTime);
      }
    } else if (uniqueEmployees.length > 0) {
      setSelectedUserId((prev) => {
        if (prev && uniqueEmployees.some((e) => String(e._id || e.id) === String(prev))) {
          return prev;
        }
        const first = uniqueEmployees[0];
        if (first?.shiftStartTime) setCheckInTime(first.shiftStartTime);
        return String(first._id || first.id);
      });
    }
  }, [existingEmployees, preselectedEmployee]);

  // Immediate synchronous initialization from props whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setDate(defaultDate || getTodayString());
      setError('');
      setCheckOutTime('');
      setStatus('present');
      setLocation('Office');
      setAdminRemark('');

      // Pre-seed from existing props immediately so dropdown is never blank
      const seeds = [];
      if (preselectedEmployee) seeds.push(preselectedEmployee);
      if (existingEmployees && existingEmployees.length > 0) seeds.push(...existingEmployees);

      if (seeds.length > 0) {
        const unique = dedupeEmployees(seeds);
        setEmployees(unique);
        const targetId = String(preselectedEmployee?._id || preselectedEmployee?.id || unique[0]._id || unique[0].id);
        setSelectedUserId(targetId);
        const matched = unique.find((e) => String(e._id || e.id) === targetId);
        if (matched?.shiftStartTime) setCheckInTime(matched.shiftStartTime);
      }

      // Fetch fresh list from server
      fetchStaff();
    }
  }, [isOpen, defaultDate, preselectedEmployee, existingEmployees, fetchStaff]);

  // Ensure current employee object matches selection
  const currentEmployee =
    employees.find((e) => String(e._id || e.id) === String(selectedUserId)) ||
    (preselectedEmployee && String(preselectedEmployee._id || preselectedEmployee.id) === String(selectedUserId)
      ? preselectedEmployee
      : null);

  // Handle employee dropdown change
  const handleEmployeeChange = (e) => {
    const id = e.target.value;
    setSelectedUserId(id);
    const emp = employees.find((item) => String(item._id || item.id) === String(id));
    if (emp && emp.shiftStartTime) {
      setCheckInTime(emp.shiftStartTime);
    }
  };

  // Auto-suggest status when check-in time changes
  const handleCheckInTimeChange = (newTime) => {
    setCheckInTime(newTime);
    if (currentEmployee && currentEmployee.shiftStartTime) {
      const [inH, inM] = newTime.split(':').map(Number);
      const [shiftH, shiftM] = currentEmployee.shiftStartTime.split(':').map(Number);
      const inMinutes = inH * 60 + inM;
      const cutoffMinutes = shiftH * 60 + shiftM + 15;
      if (inMinutes > cutoffMinutes) {
        setStatus('late');
      } else {
        setStatus('present');
      }
    }
  };

  // Submit manual attendance
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select an employee.');
      return;
    }
    if (!date) {
      setError('Please select an attendance date.');
      return;
    }
    if (!checkInTime) {
      setError('Please provide a check-in time.');
      return;
    }

    if (checkOutTime && checkOutTime < checkInTime) {
      setError('Check-out time cannot be earlier than check-in time.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Ensure date is formatted as YYYY-MM-DD
      let normalizedDate = date;
      const match = String(date).match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if (match) {
        normalizedDate = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }

      const payload = {
        userId: currentEmployee?._id || currentEmployee?.id || selectedUserId,
        employeeId: currentEmployee?.employeeId,
        date: normalizedDate,
        checkInTime,
        checkOutTime: checkOutTime || undefined,
        status,
        location,
        note: adminRemark || 'Manual Check-in by Admin',
        adminRemark: adminRemark || 'Manual attendance recorded by Admin',
      };

      const res = await api.post('/attendance/manual-checkin', payload);

      if (res.data.success) {
        if (onSuccess) onSuccess(res.data.data, res.data.message);
        onClose();
      } else {
        setError(res.data.message || 'Failed to record manual check-in.');
      }
    } catch (err) {
      console.error('Manual checkin error:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Server communication issue. Please verify backend status and try again.';
      setError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23201B]/55 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF6EE] border border-[#DCD4C4] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1B3B34] text-[#FAF6EE] p-5 sm:p-6 flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E2ECE6] text-[#1B3B34] flex items-center justify-center shrink-0 shadow-inner">
              <UserCheck className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-[#FAF6EE]">
                Manual Employee Check-In
              </h2>
              <p className="text-xs text-[#A9C7B5] mt-0.5 font-medium">
                Mark attendance or override daily punches on behalf of staff
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF6EE] transition-colors focus:outline-none"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="bg-[#FBEBE8] border border-[#F2C0B7] text-[#C25E37] p-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Employee */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#5A5347]">
                Select Employee <span className="text-[#C25E37]">*</span>
              </label>
              {loadingEmployees && (
                <span className="text-[10px] font-bold text-[#1B3B34] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Updating list...
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedUserId}
                onChange={handleEmployeeChange}
                required
                className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] font-semibold appearance-none focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37] cursor-pointer"
              >
                {employees.length === 0 ? (
                  <option value="">
                    {loadingEmployees ? '⏳ Loading employees directory...' : '⚠️ No employees available'}
                  </option>
                ) : (
                  <>
                    {!selectedUserId && <option value="">-- Choose an Employee --</option>}
                    {employees.map((emp) => (
                      <option key={emp._id || emp.id} value={emp._id || emp.id}>
                        {emp.name} ({emp.employeeId || 'Staff'}) — {emp.department || emp.designation || 'General'}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-[#5A5347] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Selected Employee Shift Preview */}
            {currentEmployee ? (
              <div className="mt-2 p-2.5 rounded-xl bg-[#EAE4D6]/60 border border-[#DCD4C4] flex items-center justify-between text-[11px] text-[#5A5347]">
                <span>
                  Registered Shift:{' '}
                  <strong className="text-[#1B3B34]">
                    {currentEmployee.shiftStartTime || '09:30'} – {currentEmployee.shiftEndTime || '18:30'}
                  </strong>
                </span>
                <span className="font-semibold text-[#8A8274]">
                  Cutoff: {currentEmployee.shiftStartTime ? '15m grace' : '09:45 AM'}
                </span>
              </div>
            ) : employees.length === 0 && !loadingEmployees ? (
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#C25E37]">
                <span>Could not load employee directory.</span>
                <button
                  type="button"
                  onClick={fetchStaff}
                  className="font-bold underline hover:text-[#AA4F2C] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Loading
                </button>
              </div>
            ) : null}
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#5A5347] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1B3B34]" />
                Attendance Date <span className="text-[#C25E37]">*</span>
              </label>
              <input
                type="date"
                value={date}
                max={getTodayString()}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] font-semibold focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5A5347] mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1B3B34]" />
                Work Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] font-semibold focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37] cursor-pointer"
              >
                <option value="Office">🏢 Office</option>
                <option value="Work From Home">🏠 Work From Home (WFH)</option>
                <option value="Client Site">🤝 Client Site / Field Visit</option>
              </select>
            </div>
          </div>

          {/* Timings: Check-In & Check-Out */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#5A5347] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1B3B34]" />
                Check-In Time <span className="text-[#C25E37]">*</span>
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => handleCheckInTimeChange(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] font-mono font-bold focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5A5347] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8A8274]" />
                Check-Out Time (Optional)
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] font-mono font-bold focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
              />
              <p className="text-[10px] text-[#8A8274] mt-1">
                Leave empty if employee is still working today.
              </p>
            </div>
          </div>

          {/* Attendance Status */}
          <div>
            <label className="block text-xs font-bold text-[#5A5347] mb-1.5">
              Attendance Status Override
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'present', label: 'Present', color: 'border-[#1B3B34] text-[#1B3B34] bg-[#E2ECE6]' },
                { id: 'late', label: 'Late', color: 'border-[#E0A96D] text-[#8C5E20] bg-[#FFF5E6]' },
                { id: 'half-day', label: 'Half-Day', color: 'border-[#4A7C59] text-[#2C5237] bg-[#EAF5EC]' },
                { id: 'absent', label: 'Absent', color: 'border-[#C25E37] text-[#AA4F2C] bg-[#FBEBE8]' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id)}
                  className={`py-2 px-2 text-xs font-black rounded-xl border transition-all text-center ${
                    status === st.id
                      ? `${st.color} shadow-xs ring-2 ring-offset-1 ring-[#1B3B34]`
                      : 'border-[#DCD4C4] bg-[#EAE4D6] text-[#5A5347] hover:bg-[#DCD4C4]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Note / Remarks */}
          <div>
            <label className="block text-xs font-bold text-[#5A5347] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#5A5347]" />
              Reason / Admin Remark
            </label>
            <input
              type="text"
              value={adminRemark}
              onChange={(e) => setAdminRemark(e.target.value)}
              placeholder="e.g. Card reader offline / On-field client meeting / Regularization"
              className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#DCD4C4] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-[#DCD4C4] text-[#5A5347] hover:bg-[#EAE4D6] text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedUserId}
              className="px-5 py-2.5 rounded-xl bg-[#1B3B34] hover:bg-[#254F46] active:scale-95 text-[#FAF6EE] text-xs font-bold transition-all shadow-warm-sm flex items-center gap-2 border border-[#142C26] disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              {submitting ? 'Recording Punch...' : 'Record Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
