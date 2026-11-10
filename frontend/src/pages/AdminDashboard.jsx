import React, { useState, useEffect } from 'react';
import api, { getPhotoUrl } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PhotoModal from '../components/PhotoModal';
import { NavLink } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  CalendarOff,
  UserX,
  Camera,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const formatTimeSafe = (timestamp) => {
    if (!timestamp) return '—';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/admin');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh feed every 30 seconds for live admin view
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Admin Welcome Banner - Artisanal Deep Forest & Sandstone Theme */}
      <div className="relative overflow-hidden bg-[#1B3B34] rounded-3xl p-6 sm:p-8 text-[#FAF6EE] shadow-warm-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-[#142C26]">
        
        {/* Subtle organic tonal pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#254F46]/50 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2ECE6]/15 text-[#A9C7B5] text-xs font-bold mb-3 border border-[#E2ECE6]/25">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C25E37]" />
            <span>Admin Management Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#FAF6EE]">
            Today's Attendance Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#D1DFD7] mt-1 font-medium">
            Real-time tracking of employee check-ins, late marks, and leave requests.
          </p>
        </div>

        {/* Attendance Rate Dial */}
        <div className="relative z-10 bg-[#142C26]/80 border border-[#2A564C] rounded-2xl p-4 flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 shadow-inner">
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-[#A9C7B5] tracking-wider">Attendance Rate</span>
            <div className="text-3xl font-black text-[#FAF6EE]">
              {stats?.attendanceRate || 0}%
            </div>
            <span className="text-[11px] text-[#D1DFD7]">
              {stats?.totalClockedIn || 0} of {stats?.totalEmployees || 0} present
            </span>
          </div>
        </div>
      </div>

      {/* Pending Leaves Alert */}
      {stats && stats.pendingLeaves > 0 && (
        <div className="p-4 bg-[#F6EFE2] border border-[#DFCBB5] rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAE4D6] border border-[#DFCBB5] flex items-center justify-center text-[#8F5413] font-bold shrink-0">
              {stats.pendingLeaves}
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#8F5413]">
                {stats.pendingLeaves} Leave {stats.pendingLeaves === 1 ? 'Request' : 'Requests'} Pending Approval
              </h4>
              <p className="text-[11px] text-[#8F5413]/80">Team members are awaiting your review.</p>
            </div>
          </div>
          <NavLink
            to="/admin/leaves"
            className="text-xs font-bold text-[#FAF6EE] flex items-center gap-1 bg-[#C25E37] hover:bg-[#AA4F2C] px-3.5 py-1.5 rounded-xl transition-all shadow-warm-sm shrink-0 border border-[#A74E2B]"
          >
            Review Now
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        
        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Total Staff</span>
            <div className="w-8 h-8 rounded-xl bg-[#EAE4D6] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#1B3B34]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1B3B34] mt-2">
            {stats?.totalEmployees || 0}
          </div>
          <span className="text-[11px] text-[#5A5347] mt-0.5 block">Active accounts</span>
        </div>

        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Present</span>
            <div className="w-8 h-8 rounded-xl bg-[#E2ECE6] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#1B3B34]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1B3B34] mt-2">
            {stats?.presentCount || 0}
          </div>
          <span className="text-[11px] text-[#1B3B34]/80 mt-0.5 block">On time check-ins</span>
        </div>

        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Late Arrivals</span>
            <div className="w-8 h-8 rounded-xl bg-[#F6EFE2] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#9C6500]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#9C6500] mt-2">
            {stats?.lateCount || 0}
          </div>
          <span className="text-[11px] text-[#9C6500]/80 mt-0.5 block">Past 09:45 AM</span>
        </div>

        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">On Leave</span>
            <div className="w-8 h-8 rounded-xl bg-[#EAE4D6] flex items-center justify-center">
              <CalendarOff className="w-4 h-4 text-[#5A5347]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#23201B] mt-2">
            {stats?.onLeaveCount || 0}
          </div>
          <span className="text-[11px] text-[#5A5347] mt-0.5 block">Approved leaves</span>
        </div>

        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Absent</span>
            <div className="w-8 h-8 rounded-xl bg-[#F8ECE9] flex items-center justify-center">
              <UserX className="w-4 h-4 text-[#C25E37]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#C25E37] mt-2">
            {stats?.absentCount || 0}
          </div>
          <span className="text-[11px] text-[#C25E37]/80 mt-0.5 block">Pending punch</span>
        </div>

      </div>

      {/* Live Feed: Today's Verified Check-ins with Photos */}
      <div className="bg-[#FAF6EE] rounded-3xl border border-[#DCD4C4] shadow-warm-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-[#1B3B34] flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#C25E37]" />
              Live Check-In Feed & Verified Photos
            </h3>
            <p className="text-xs text-[#5A5347] font-medium">
              Real-time employee selfies captured during clock in/out today
            </p>
          </div>
          <NavLink
            to="/admin/attendance"
            className="text-xs font-bold text-[#C25E37] hover:text-[#AA4F2C] flex items-center gap-1 hover:underline"
          >
            View Master Sheet
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#8A8274] text-xs">
            Loading live attendance feed...
          </div>
        ) : !stats?.recentCheckIns || stats.recentCheckIns.length === 0 ? (
          <div className="py-12 text-center text-[#8A8274] text-xs">
            No check-ins recorded yet for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {stats.recentCheckIns.map((rec) => {
              const clockInPhoto = rec.clockIn?.photo;
              const clockOutPhoto = rec.clockOut?.photo;
              return (
                <div
                  key={rec._id}
                  className="group bg-[#EAE4D6]/50 border border-[#DCD4C4] rounded-2xl p-4 flex flex-col justify-between hover:border-[#1B3B34] hover:bg-[#FAF6EE] hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300"
                >
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-video bg-[#23201B] rounded-xl overflow-hidden mb-3 border border-[#DCD4C4]">
                    {clockInPhoto ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPhoto({
                            url: clockInPhoto,
                            title: `Clock-In: ${rec.user?.name || 'Staff'}`,
                            employee: rec.user?.name || 'Staff',
                            employeeId: rec.user?.employeeId || '—',
                            time: rec.clockIn?.timestamp,
                          })
                        }
                        className="w-full h-full relative cursor-pointer overflow-hidden"
                      >
                        <img
                          src={getPhotoUrl(clockInPhoto)}
                          alt={rec.user?.name || 'Employee'}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-[#23201B]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#FAF6EE] text-[11px] font-bold transition-opacity backdrop-blur-[2px]">
                          Inspect Selfie
                        </div>
                      </button>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8A8274] text-xs">
                        No photo
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <StatusBadge status={rec.status} />
                      {rec.clockIn?.location && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#23201B]/80 text-[#FAF6EE] backdrop-blur-md border border-white/20 shadow-xs">
                          {rec.clockIn.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#23201B] text-xs truncate">
                        {rec.user?.name || 'Staff Member'}
                      </h4>
                      <span className="text-[10px] font-bold text-[#8A8274]">
                        {rec.user?.employeeId || '—'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5A5347] truncate">
                      {rec.user?.department || 'General'}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#DCD4C4] flex items-center justify-between text-[11px] text-[#5A5347]">
                      <span>Clock In:</span>
                      <span className="font-bold text-[#23201B] font-mono">
                        {formatTimeSafe(rec.clockIn?.timestamp)}
                      </span>
                    </div>

                    {rec.clockOut?.timestamp && (
                      <div className="flex items-center justify-between text-[11px] text-[#5A5347] mt-1">
                        <span>Clock Out:</span>
                        <span className="font-bold text-[#23201B] font-mono">
                          {formatTimeSafe(rec.clockOut.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
          }}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

    </div>
  );
}

