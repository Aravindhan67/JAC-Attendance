import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PhotoModal from '../components/PhotoModal';
import { Calendar, Clock, Camera, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MyAttendance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [exceptionQuota, setExceptionQuota] = useState(null);
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
        if (res.data.exceptionQuota) {
          setExceptionQuota(res.data.exceptionQuota);
        }
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
          <h1 className="text-2xl font-black text-[#1B3B34] tracking-tight">My Attendance History</h1>
          <p className="text-xs text-[#5A5347] mt-0.5 font-medium">
            View daily punches, verified photos, and total hours worked
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-[#FAF6EE] px-3.5 py-2 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
          <Calendar className="w-4 h-4 text-[#C25E37]" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs font-bold text-[#23201B] bg-transparent focus:outline-none cursor-pointer"
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
            className="text-xs font-bold text-[#23201B] bg-transparent focus:outline-none cursor-pointer border-l border-[#DCD4C4] pl-2"
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
              <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Days Logged</span>
              <div className="text-xl font-black text-[#1B3B34] mt-0.5">{stats.totalDays}</div>
            </div>
            <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
              <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Present</span>
              <div className="text-xl font-black text-[#1B3B34] mt-0.5">{stats.totalPresent}</div>
            </div>
            <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
              <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Late Punches</span>
              <div className="text-xl font-black text-[#9C6500] mt-0.5">{stats.totalLate}</div>
            </div>
            <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
              <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Total Hours</span>
              <div className="text-xl font-black text-[#C25E37] mt-0.5">{stats.totalHours} hrs</div>
            </div>
          </div>

          {/* Monthly Late & Forgot Punch Passes Banner */}
          {exceptionQuota && (
            <div className="bg-[#F6EFE2] border border-[#DFCBB5] rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-warm-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C25E37]" />
                <span className="font-black text-[#8F5413]">
                  Late & Forgot Check-In Allowance:
                </span>
                <span className="font-bold text-[#8F5413]">
                  {exceptionQuota.used} of 3 used this month ({exceptionQuota.remaining} remaining)
                </span>
              </div>
              <span className="text-[11px] text-[#8F5413]/80 font-semibold">
                Refreshes automatically to 3 on the 1st of every month
              </span>
            </div>
          )}
        </div>
      )}

      {/* Attendance Log Table */}
      <div className="bg-[#FAF6EE] rounded-3xl border border-[#DCD4C4] shadow-warm-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EAE4D6]/70 text-[#5A5347] uppercase tracking-wider text-[10px] font-bold border-b border-[#DCD4C4]">
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
            <tbody className="divide-y divide-[#DCD4C4]/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#8A8274]">
                    Loading attendance history...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#8A8274]">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="hover:bg-[#EAE4D6]/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#23201B]">
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
                          <span className="text-[10px] font-semibold text-[#5A5347] bg-[#EAE4D6] px-1.5 py-0.5 rounded border border-[#DCD4C4]">
                            {r.clockIn.location}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#23201B] font-mono text-[11px]">
                      {r.clockIn?.timestamp
                        ? new Date(r.clockIn.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-4 px-4 text-[#23201B] font-mono text-[11px]">
                      {r.clockOut?.timestamp
                        ? new Date(r.clockOut.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-4 px-4 font-bold text-[#23201B]">
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
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAE4D6] text-[#1B3B34] hover:bg-[#DCD4C4] font-bold text-[11px] transition-colors border border-[#DCD4C4]"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#C25E37]" />
                          View Photo
                        </button>
                      ) : (
                        <span className="text-[#8A8274] text-[11px]">No Photo</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-[#5A5347]">
                      <div className="flex flex-col gap-1 items-start">
                        {((r.exceptionType && r.exceptionType !== 'none') || (r.clockIn?.punchType && r.clockIn.punchType !== 'Regular')) && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F6EFE2] text-[#8F5413] border border-[#DFCBB5]">
                            {r.exceptionType && r.exceptionType !== 'none' ? r.exceptionType : r.clockIn?.punchType}
                          </span>
                        )}
                        <span>{r.clockIn?.note || r.adminRemark || '—'}</span>
                      </div>
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

