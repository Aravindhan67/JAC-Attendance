import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PhotoModal from '../components/PhotoModal';
import { Calendar, Clock, Camera, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MyAttendance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/my-history?month=${selectedMonth}&year=${selectedYear}`);
      if (res.data.success) {
        setRecords(res.data.data);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedMonth, selectedYear]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Title & Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">My Attendance History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View daily punches, verified photos, and total hours worked
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          <Calendar className="w-4 h-4 text-amber-500" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
          >
            {monthNames.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer border-l border-slate-200 pl-2"
          >
            {[2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Days Logged</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{stats.totalDays}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Present</span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{stats.totalPresent}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Late</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">{stats.totalLate}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total Hours</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">{stats.totalHours} hrs</div>
          </div>
        </div>
      )}

      {/* Attendance Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Clock In</th>
                <th className="py-3.5 px-4">Clock Out</th>
                <th className="py-3.5 px-4">Hours</th>
                <th className="py-3.5 px-4 text-center">Selfie Photo</th>
                <th className="py-3.5 px-6">Remarks / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading attendance history...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {new Date(r.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={r.status} />
                        {r.clockIn?.location && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {r.clockIn.location}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">
                      {r.clockIn?.timestamp
                        ? new Date(r.clockIn.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">
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
                              title: `Clock-In Selfie (${r.date})`,
                              time: r.clockIn.timestamp,
                              date: r.date,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-[11px] transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          View Photo
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No Photo</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
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
            time: selectedPhoto.time,
            date: selectedPhoto.date,
          }}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

    </div>
  );
}

