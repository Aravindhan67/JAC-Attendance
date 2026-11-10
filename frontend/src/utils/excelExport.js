/**
 * Generates and downloads a formatted Excel (.xlsx) report for an individual employee
 * Uses dynamic import for 'xlsx' so the heavy library is never bundled into initial page load
 * @param {Object} employee - Employee object { name, employeeId, department, designation, email, phone, shiftStartTime, shiftEndTime }
 * @param {Array} records - Array of attendance records
 * @param {Object} summary - Summary statistics
 * @param {Array} leaves - Array of approved leaves
 * @param {Object} period - { startDate, endDate, label }
 */
export const exportIndividualEmployeeExcel = async ({
  employee,
  records = [],
  summary = {},
  leaves = [],
  period = {},
}) => {
  // Dynamically load SheetJS only on demand
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // 1. Prepare Main Attendance Worksheet Data (Array of Arrays)
  const aoa = [];

  // Header banner
  aoa.push(['JAC MEDIA - INDIVIDUAL EMPLOYEE ATTENDANCE & AUDIT REPORT']);
  aoa.push(['Confidential Payroll & Performance Record']);
  aoa.push([]); // Blank line

  // Employee Profile Block
  aoa.push(['EMPLOYEE INFORMATION', '', 'REPORT DETAILS', '']);
  aoa.push(['Employee Name:', employee?.name || 'Unknown', 'Period:', period.label || `${period.startDate} to ${period.endDate}`]);
  aoa.push(['Employee ID:', employee?.employeeId || 'N/A', 'Generated On:', new Date().toLocaleString()]);
  aoa.push(['Department:', employee?.department || 'N/A', 'Shift Timings:', `${employee?.shiftStartTime || '09:30 AM'} – ${employee?.shiftEndTime || '06:30 PM'}`]);
  aoa.push(['Designation:', employee?.designation || 'N/A', 'Contact Email:', employee?.email || 'N/A']);
  aoa.push(['Phone Number:', employee?.phone || 'N/A', 'Working Location:', 'JAC Media Office / Remote']);
  aoa.push([]); // Blank line

  // Summary Metrics Section
  aoa.push(['ATTENDANCE METRICS SUMMARY']);
  aoa.push([
    'Total Days Logged',
    'Present Days',
    'Late Arrivals',
    'Half Days',
    'Absent Days',
    'Approved Leaves',
    'Total Work Hours',
    'Avg Daily Hours',
    'Late/Forgot Exceptions Used',
  ]);
  aoa.push([
    summary.totalDays || records.length || 0,
    summary.totalPresent || records.filter((r) => r.status === 'present').length,
    summary.totalLate || records.filter((r) => r.status === 'late').length,
    summary.totalHalfDay || records.filter((r) => r.status === 'half-day').length,
    summary.totalAbsent || records.filter((r) => r.status === 'absent').length,
    summary.totalLeaves || leaves.length || 0,
    summary.totalHours || 0,
    summary.avgDailyHours || 0,
    summary.totalExceptions || 0,
  ]);
  aoa.push([]); // Blank line

  // Detailed Day-by-Day Attendance Table
  aoa.push(['DAILY ATTENDANCE BREAKDOWN']);
  aoa.push([
    'S.No',
    'Date',
    'Day',
    'Status',
    'Work Mode',
    'Clock In Time',
    'Clock Out Time',
    'Total Hours',
    'Punch Type / Exception',
    'Approval Status',
    'Employee Notes',
    'Admin Remarks / Reason',
  ]);

  if (records.length === 0) {
    aoa.push(['No attendance records found for this period.', '', '', '', '', '', '', '', '', '', '', '']);
  } else {
    records.forEach((r, idx) => {
      // Calculate day of the week
      let dayName = '';
      if (r.date) {
        try {
          const dateObj = new Date(`${r.date}T00:00:00`);
          dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        } catch (e) {
          dayName = '';
        }
      }

      const clockInTime = r.clockIn?.timestamp
        ? new Date(r.clockIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        : '—';

      const clockOutTime = r.clockOut?.timestamp
        ? new Date(r.clockOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        : '—';

      const punchType =
        r.exceptionType && r.exceptionType !== 'none'
          ? r.exceptionType
          : r.clockIn?.punchType || 'Regular';

      const approvalStatus = r.approvalStatus && r.approvalStatus !== 'none' ? r.approvalStatus.toUpperCase() : 'VERIFIED';

      aoa.push([
        idx + 1,
        r.date || '—',
        dayName,
        (r.status || 'present').toUpperCase(),
        r.clockIn?.location || 'Office',
        clockInTime,
        clockOutTime,
        r.totalHours ? Number(r.totalHours) : 0,
        punchType,
        approvalStatus,
        r.clockIn?.note || '',
        r.adminRemark || '',
      ]);
    });
  }

  // Convert Array of Arrays to Sheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set intelligent column widths for crisp Excel viewing
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 13 }, // Date
    { wch: 10 }, // Day
    { wch: 14 }, // Status
    { wch: 12 }, // Work Mode
    { wch: 15 }, // Clock In
    { wch: 15 }, // Clock Out
    { wch: 13 }, // Total Hours
    { wch: 24 }, // Punch Type / Exception
    { wch: 16 }, // Approval Status
    { wch: 28 }, // Employee Notes
    { wch: 32 }, // Admin Remarks
  ];

  // Append Main Sheet to Workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

  // 2. Prepare Leaves Sheet if leaves exist
  if (leaves && leaves.length > 0) {
    const leavesAoa = [
      ['JAC MEDIA - APPROVED LEAVE RECORDS'],
      [`Employee: ${employee?.name || ''} (${employee?.employeeId || ''})`],
      [],
      ['S.No', 'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Status', 'Reason', 'Admin Remarks'],
    ];

    leaves.forEach((l, i) => {
      leavesAoa.push([
        i + 1,
        l.leaveType,
        l.startDate ? new Date(l.startDate).toLocaleDateString() : '—',
        l.endDate ? new Date(l.endDate).toLocaleDateString() : '—',
        l.totalDays || 1,
        (l.status || 'approved').toUpperCase(),
        l.reason || '',
        l.adminRemarks || '',
      ]);
    });

    const leavesWs = XLSX.utils.aoa_to_sheet(leavesAoa);
    leavesWs['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, leavesWs, 'Leave History');
  }

  // Construct Clean Safe Filename
  const cleanEmpId = (employee?.employeeId || 'EMP').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanName = (employee?.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
  const periodTag = (period.label || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `JAC_Attendance_${cleanEmpId}_${cleanName}_${periodTag}.xlsx`;

  // Trigger browser download of .xlsx file
  XLSX.writeFile(wb, filename);
  return filename;
};
