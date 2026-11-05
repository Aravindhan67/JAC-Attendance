import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PhotoModal from '../components/PhotoModal';
import {
  Calendar,
  Search,
  Filter,
  Download,
  Camera,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    fetchAttendance();
  }, [dateFilter, departmentFilter, statusFilter]);

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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Attendance Master Sheet</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit daily employee punches, verification selfies, and export payroll reports
          </p>
        </div>

        <button
          type="button"
          onClick={exportToCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-200 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No attendance records found matching filters for {dateFilter}.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{r.user?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {r.user?.employeeId || '—'}
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
                    <td className="py-4 px-6 text-slate-500 italic max-w-xs truncate">
                      {r.clockIn?.note || r.adminRemark || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

