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
      
      {/* Admin Welcome Banner - Premium Black & Gold Theme */}
      <div className="relative overflow-hidden bg-gradient-to-r from-black via-zinc-950 to-neutral-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-black/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-2 border-amber-500/30">
        
        {/* Ambient gold glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold mb-3 border border-amber-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Management Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300">
            Today's Attendance Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time tracking of employee check-ins, late marks, and leave requests.
          </p>
        </div>

        {/* Attendance Rate Dial */}
        <div className="relative z-10 bg-black/60 border border-amber-400/30 rounded-2xl p-4 flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 shadow-inner">
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-amber-300/80 tracking-wider">Attendance Rate</span>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300">
              {stats?.attendanceRate || 0}%
            </div>
            <span className="text-[11px] text-amber-100/70">
              {stats?.totalClockedIn || 0} of {stats?.totalEmployees || 0} present
            </span>
          </div>
        </div>
      </div>

      {/* Pending Leaves Alert */}
      {stats && stats.pendingLeaves > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold shrink-0">
              {stats.pendingLeaves}
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {stats.pendingLeaves} Leave {stats.pendingLeaves === 1 ? 'Request' : 'Requests'} Pending Approval
              </h4>
              <p className="text-[11px] text-amber-700">Team members are awaiting your review.</p>
            </div>
          </div>
          <NavLink
            to="/admin/leaves"
            className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 bg-amber-100/80 px-3 py-1.5 rounded-xl hover:bg-amber-200 transition-colors shrink-0"
          >
            Review Now
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total Staff</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {stats?.totalEmployees || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Active accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Present</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {stats?.presentCount || 0}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">On time check-ins</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Late Arrivals</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {stats?.lateCount || 0}
          </div>
          <span className="text-[11px] text-amber-600/80 mt-0.5 block">Past 09:45 AM</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">On Leave</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <CalendarOff className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">
            {stats?.onLeaveCount || 0}
          </div>
          <span className="text-[11px] text-indigo-600/80 mt-0.5 block">Approved leaves</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Absent / Unreported</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <UserX className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {stats?.absentCount || 0}
          </div>
          <span className="text-[11px] text-rose-600/80 mt-0.5 block">Pending punch</span>
        </div>

      </div>

      {/* Live Feed: Today's Verified Check-ins with Photos */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              Live Check-In Feed & Verified Photos
            </h3>
            <p className="text-xs text-slate-500">
              Real-time employee selfies captured during clock in/out today
            </p>
          </div>
          <NavLink
            to="/admin/attendance"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
          >
            View Master Sheet
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading live attendance feed...
          </div>
        ) : !stats?.recentCheckIns || stats.recentCheckIns.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
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
                  className="group bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-400 hover:bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
                >
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden mb-3">
                    {clockInPhoto ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPhoto({
                            url: clockInPhoto,
                            title: `Clock-In: ${rec.user?.name}`,
                            employee: rec.user?.name,
                            employeeId: rec.user?.employeeId,
                            time: rec.clockIn.timestamp,
                          })
                        }
                        className="w-full h-full relative cursor-pointer overflow-hidden"
                      >
                        <img
                          src={getPhotoUrl(clockInPhoto)}
                          alt={rec.user?.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity backdrop-blur-[2px]">
                          Inspect Selfie
                        </div>
                      </button>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                        No photo
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <StatusBadge status={rec.status} />
                      {rec.clockIn?.location && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-xs">
                          {rec.clockIn.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-xs truncate">
                        {rec.user?.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        {rec.user?.employeeId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {rec.user?.department}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Clock In:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {rec.clockIn?.timestamp
                          ? new Date(rec.clockIn.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>
                    </div>

                    {rec.clockOut?.timestamp && (
                      <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                        <span>Clock Out:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {new Date(rec.clockOut.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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

