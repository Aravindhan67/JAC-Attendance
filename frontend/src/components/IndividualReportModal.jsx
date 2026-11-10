import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { exportIndividualEmployeeExcel } from '../utils/excelExport';
import {
  FileSpreadsheet,
  Calendar,
  User as UserIcon,
  Download,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Helper to format date as YYYY-MM-DD in local time without UTC offset drift
const formatDateLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function IndividualReportModal({
  isOpen,
  onClose,
  initialEmployee = null,
}) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [rangePreset, setRangePreset] = useState('this-month'); // 'this-month' | 'last-month' | 'last-30' | 'custom'

  // Default dates: First day of current month to Last day of current month in local time
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [startDate, setStartDate] = useState(formatDateLocal(new Date(currentYear, currentMonth, 1)));
  const [endDate, setEndDate] = useState(formatDateLocal(new Date(currentYear, currentMonth + 1, 0)));

  // Report & preview data
  const [reportData, setReportData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch employees list on open
  useEffect(() => {
    if (!isOpen) return;

    const loadEmployees = async () => {
      try {
        const res = await api.get('/employees');
        if (res.data.success) {
          setEmployees(res.data.data);
          if (initialEmployee?._id) {
            setSelectedEmpId(initialEmployee._id);
          } else if (res.data.data.length > 0 && !selectedEmpId) {
            setSelectedEmpId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load employees for report:', err);
      }
    };

    loadEmployees();
  }, [isOpen, initialEmployee]);

  // Handle Preset Changes in local timezone
  const handlePresetChange = (preset) => {
    setRangePreset(preset);
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();

    if (preset === 'this-month') {
      setStartDate(formatDateLocal(new Date(y, m, 1)));
      setEndDate(formatDateLocal(new Date(y, m + 1, 0)));
    } else if (preset === 'last-month') {
      setStartDate(formatDateLocal(new Date(y, m - 1, 1)));
      setEndDate(formatDateLocal(new Date(y, m, 0)));
    } else if (preset === 'last-30') {
      const prevDate = new Date();
      prevDate.setDate(today.getDate() - 30);
      setStartDate(formatDateLocal(prevDate));
      setEndDate(formatDateLocal(today));
    }
  };

  // Fetch preview data with automatic fallback to /attendance/all
  useEffect(() => {
    if (!isOpen || !selectedEmpId || !startDate || !endDate) return;

    let isMounted = true;
    const fetchPreview = async () => {
      setLoadingPreview(true);
      setErrorMsg('');

      const emp = employees.find((e) => e._id === selectedEmpId) || initialEmployee;

      try {
        // Primary Attempt: Try dedicated individual report endpoint
        const res = await api.get(
          `/attendance/report/employee/${selectedEmpId}?startDate=${startDate}&endDate=${endDate}`
        );
        if (isMounted && res.data.success) {
          setReportData(res.data.data);
          return;
        }
      } catch (primaryErr) {
        // Fallback: If dedicated endpoint is 404 (e.g. backend still deploying), fetch from /attendance/all and aggregate
        try {
          const allRes = await api.get(`/attendance/all`);
          if (isMounted && allRes.data.success) {
            const allRecords = allRes.data.data || [];
            
            // Filter by selected employee and date range
            const filtered = allRecords.filter((r) => {
              const matchesUser =
                r.user?._id === selectedEmpId ||
                r.user?.employeeId === emp?.employeeId;
              const matchesDate = r.date >= startDate && r.date <= endDate;
              return matchesUser && matchesDate;
            });

            // Sort ascending by date
            filtered.sort((a, b) => (a.date > b.date ? 1 : -1));

            // Aggregate metrics
            const totalDays = filtered.length;
            const totalPresent = filtered.filter((r) => r.status === 'present').length;
            const totalLate = filtered.filter((r) => r.status === 'late').length;
            const totalHalfDay = filtered.filter((r) => r.status === 'half-day').length;
            const totalAbsent = filtered.filter((r) => r.status === 'absent').length;
            const totalHours = filtered.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
            const avgDailyHours = totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0;
            const totalExceptions = filtered.filter(
              (r) =>
                r.exceptionType === 'Late Check-In' ||
                r.exceptionType === 'Forgot Check-In' ||
                r.exceptionType === 'Forgot Check-Out' ||
                r.clockIn?.punchType === 'Late Check-In' ||
                r.clockIn?.punchType === 'Forgot Check-In' ||
                r.clockOut?.punchType === 'Forgot Check-Out'
            ).length;

            setReportData({
              employee: emp,
              records: filtered,
              leaves: [],
              summary: {
                totalDays,
                totalPresent,
                totalLate,
                totalHalfDay,
                totalAbsent,
                totalLeaves: 0,
                totalHours: Math.round(totalHours * 100) / 100,
                avgDailyHours,
                totalExceptions,
              },
            });
            return;
          }
        } catch (fallbackErr) {
          if (isMounted) {
            setErrorMsg(
              fallbackErr.response?.data?.message ||
              primaryErr.response?.data?.message ||
              'Failed to fetch attendance data'
            );
          }
        }
      } finally {
        if (isMounted) setLoadingPreview(false);
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedEmpId, startDate, endDate, employees]);

  // Download Excel
  const handleDownloadExcel = async () => {
    const currentEmp = reportData?.employee || employees.find((e) => e._id === selectedEmpId);
    if (!currentEmp) {
      setErrorMsg('Please select an employee first.');
      return;
    }

    setGenerating(true);
    try {
      let label = `${startDate} to ${endDate}`;
      if (rangePreset === 'this-month') {
        const [y, m] = startDate.split('-');
        const monthDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        label = monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      } else if (rangePreset === 'last-month') {
        const [y, m] = startDate.split('-');
        const monthDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        label = monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      }

      await exportIndividualEmployeeExcel({
        employee: currentEmp,
        records: reportData?.records || [],
        summary: reportData?.summary || {
          totalDays: reportData?.records?.length || 0,
          totalPresent: (reportData?.records || []).filter((r) => r.status === 'present').length,
          totalLate: (reportData?.records || []).filter((r) => r.status === 'late').length,
          totalHalfDay: (reportData?.records || []).filter((r) => r.status === 'half-day').length,
          totalAbsent: (reportData?.records || []).filter((r) => r.status === 'absent').length,
          totalLeaves: 0,
          totalHours: (reportData?.records || []).reduce((acc, curr) => acc + (curr.totalHours || 0), 0),
          avgDailyHours: 0,
          totalExceptions: 0,
        },
        leaves: reportData?.leaves || [],
        period: {
          startDate,
          endDate,
          label,
        },
      });

      onClose();
    } catch (err) {
      console.error('Excel generation error:', err);
      setErrorMsg('Error generating Excel file: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  const currentEmployee = reportData?.employee || employees.find((e) => e._id === selectedEmpId);
  const summary = reportData?.summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF6EE] rounded-2xl max-w-xl w-full border border-[#DCD4C4] shadow-warm-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-[#1B3B34] p-5 text-[#FAF6EE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#142E28] border border-[#234A42] flex items-center justify-center text-[#FAF6EE]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#FAF6EE]">Individual Employee Attendance Report</h3>
              <p className="text-[#D8E6DF] text-[11px]">
                Export audit-grade Excel (.xlsx) file with daily breakdown & metrics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black/15 hover:bg-black/25 text-[#FAF6EE] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FAF0ED] border border-[#EAC7BF] text-[#9C3F2B] text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C25E37]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Employee Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#23201B] flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[#1B3B34]" />
              Select Employee
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full text-xs p-3 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl font-bold text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]/20 focus:border-[#C25E37] cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employeeId}) — {emp.department}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Date Range Presets & Inputs */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#23201B] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1B3B34]" />
              Reporting Period
            </label>
            
            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'this-month', label: 'This Month' },
                { id: 'last-month', label: 'Last Month' },
                { id: 'last-30', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id)}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    rangePreset === p.id
                      ? 'bg-[#1B3B34] text-[#FAF6EE] border-[#1B3B34] shadow-xs'
                      : 'bg-[#EAE4D6] text-[#5A5347] border-[#DCD4C4] hover:bg-[#DCD4C4]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] font-bold text-[#8A8274] block mb-1">START DATE</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setRangePreset('custom');
                    setStartDate(e.target.value);
                  }}
                  className="w-full text-xs p-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl font-semibold text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]/20 focus:border-[#C25E37]"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#8A8274] block mb-1">END DATE</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setRangePreset('custom');
                    setEndDate(e.target.value);
                  }}
                  className="w-full text-xs p-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl font-semibold text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]/20 focus:border-[#C25E37]"
                />
              </div>
            </div>
          </div>

          {/* 3. Live Preview & Statistics Card */}
          <div className="bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCD4C4] pb-2.5">
              <span className="text-[11px] font-black uppercase text-[#8A8274] tracking-wider">
                Report Preview
              </span>
              {loadingPreview && (
                <span className="text-[11px] text-[#1B3B34] font-bold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Calculating...
                </span>
              )}
            </div>

            {currentEmployee && (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#FAF6EE] border border-[#DCD4C4] text-[#1B3B34] font-black flex items-center justify-center text-sm shrink-0">
                  {currentEmployee.name?.charAt(0) || 'E'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-[#23201B] truncate">
                    {currentEmployee.name}
                  </div>
                  <div className="text-[11px] text-[#5A5347] flex items-center gap-2">
                    <span className="font-mono font-bold text-[#1B3B34] bg-[#FAF6EE] px-1.5 py-0.2 rounded border border-[#DCD4C4]">
                      {currentEmployee.employeeId}
                    </span>
                    <span>•</span>
                    <span className="truncate">{currentEmployee.department}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            {summary ? (
              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                <div className="bg-[#FAF6EE] p-2.5 rounded-xl border border-[#DCD4C4] shadow-xs">
                  <div className="text-[10px] font-bold text-[#8A8274] uppercase">Present</div>
                  <div className="text-base font-black text-[#1B3B34]">{summary.totalPresent}</div>
                </div>
                <div className="bg-[#FAF6EE] p-2.5 rounded-xl border border-[#DCD4C4] shadow-xs">
                  <div className="text-[10px] font-bold text-[#8A8274] uppercase">Late</div>
                  <div className="text-base font-black text-[#B88B42]">{summary.totalLate}</div>
                </div>
                <div className="bg-[#FAF6EE] p-2.5 rounded-xl border border-[#DCD4C4] shadow-xs">
                  <div className="text-[10px] font-bold text-[#8A8274] uppercase">Half-Day</div>
                  <div className="text-base font-black text-[#C25E37]">{summary.totalHalfDay}</div>
                </div>
                <div className="bg-[#FAF6EE] p-2.5 rounded-xl border border-[#DCD4C4] shadow-xs">
                  <div className="text-[10px] font-bold text-[#8A8274] uppercase">Work Hours</div>
                  <div className="text-base font-black text-[#23201B]">{summary.totalHours}h</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-[#8A8274]">
                {loadingPreview ? 'Loading attendance data...' : 'No records logged in selected date range.'}
              </div>
            )}

            {/* Extra summary row */}
            {summary && (
              <div className="text-[11px] text-[#5A5347] flex items-center justify-between pt-1">
                <span>
                  Total Logs: <strong className="text-[#23201B]">{summary.totalDays} days</strong>
                </span>
                <span>
                  Approved Leaves: <strong className="text-[#23201B]">{summary.totalLeaves}</strong>
                </span>
                <span>
                  Avg Daily: <strong className="text-[#23201B]">{summary.avgDailyHours} hrs/day</strong>
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Buttons */}
        <div className="p-4 bg-[#EAE4D6] border-t border-[#DCD4C4] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#DCD4C4] text-[#5A5347] hover:bg-[#DCD4C4] font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={generating || loadingPreview || !currentEmployee}
            onClick={handleDownloadExcel}
            className="px-5 py-2.5 rounded-xl bg-[#C25E37] hover:bg-[#AA4F2C] text-[#FAF6EE] font-black text-xs shadow-warm-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{generating ? 'Exporting...' : 'Download Excel Report (.xlsx)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
