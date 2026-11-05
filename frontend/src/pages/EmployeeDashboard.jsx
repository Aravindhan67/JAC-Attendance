import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getPhotoUrl } from '../api/client';
import CameraCaptureModal from '../components/CameraCaptureModal';
import StatusBadge from '../components/StatusBadge';
import PhotoModal from '../components/PhotoModal';
import {
  Camera,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  LogOut,
  Sparkles,
  MapPin,
  FileText,
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthStats, setMonthStats] = useState(null);
  const [modalType, setModalType] = useState(null); // 'Clock In' | 'Clock Out' | null
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data.success) {
        setTodayRecord(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      const res = await api.get(`/attendance/my-history?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      if (res.data.success) {
        setMonthStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchStats();

    // Listen to center camera trigger from mobile bottom nav
    const handleOpenPunchModal = () => {
      setTodayRecord((currRecord) => {
        if (!currRecord?.clockIn?.timestamp) {
          setModalType('Clock In');
        } else if (!currRecord?.clockOut?.timestamp) {
          setModalType('Clock Out');
        }
        return currRecord;
      });
    };

    window.addEventListener('open-punch-modal', handleOpenPunchModal);
    return () => window.removeEventListener('open-punch-modal', handleOpenPunchModal);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleClockAction = async ({ photo, note, location }) => {
    try {
      if (modalType === 'Clock In') {
        const res = await api.post('/attendance/clock-in', { photo, note, location: location || 'Office' });
        showToast(res.data.message || 'Clocked In Successfully!');
      } else {
        const res = await api.post('/attendance/clock-out', { photo, note, location: location || 'Office' });
        showToast(res.data.message || 'Clocked Out Successfully!');
      }
      await fetchTodayStatus();
      await fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Action failed', 'error');
      throw err;
    }
  };

  const isClockedIn = Boolean(todayRecord?.clockIn?.timestamp);
  const isClockedOut = Boolean(todayRecord?.clockOut?.timestamp);

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
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="opacity-80 hover:opacity-100 text-base">✕</button>
        </div>
      )}

      {/* Greeting Banner - Premium Black & Gold Theme */}
      <div className="relative overflow-hidden bg-gradient-to-r from-black via-zinc-950 to-neutral-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-black/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-2 border-amber-500/30">
        
        {/* Ambient gold glow inside banner */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold mb-3 border border-amber-400/30 backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            <span>IT Workspace • {user?.department || 'Engineering'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300">
            Hello, {user?.name || 'Developer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
            Daily shift: <span className="font-bold text-amber-200">{user?.shiftStartTime || '09:30'} AM</span> to{' '}
            <span className="font-bold text-amber-200">{user?.shiftEndTime || '06:30'} PM</span>. Facial selfie verification active.
          </p>
        </div>

        {/* Date Card */}
        <div className="relative z-10 bg-black/60 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-4 text-center sm:text-right shrink-0 shadow-inner">
          <div className="text-[10px] uppercase tracking-widest text-amber-300 font-black">TODAY'S TIMELINE</div>
          <div className="text-base sm:text-lg font-black text-white mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-[11px] text-amber-200/70 mt-0.5 flex items-center justify-center sm:justify-end gap-1">
            <MapPin className="w-3 h-3 text-amber-400" />
            JAC MediaLand Hub
          </div>
        </div>
      </div>

      {/* Primary Action Card: Clock In / Clock Out */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:border-amber-400/40 transition-all duration-300">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">PUNCH STATUS</span>
              {todayRecord ? (
                <StatusBadge status={todayRecord.status} />
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  Not Marked Yet
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {!isClockedIn
                ? 'Ready to clock in for your shift?'
                : !isClockedOut
                ? '🟢 Active Shift in Progress'
                : '✨ Day Completed — Great Work!'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {!isClockedIn
                ? 'Click below to snap a quick selfie, select work mode (Office, WFH, On-site) and log punch.'
                : !isClockedOut
                ? 'Your shift is currently active. Snap your selfie when clocking out at end of workday.'
                : 'All shift logs and hours have been recorded in the enterprise registry.'}
            </p>
          </div>

          {/* Action Trigger Button - Premium Gold Accent */}
          <div className="w-full sm:w-auto">
            {!isClockedIn ? (
              <button
                type="button"
                onClick={() => setModalType('Clock In')}
                className="w-full sm:w-auto justify-center bg-gradient-to-r from-[#B38728] via-[#D4AF37] to-[#C59B27] hover:from-[#A2771E] hover:to-[#B38728] text-slate-950 font-bold px-7 py-3.5 rounded-2xl shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 text-sm transition-all duration-200 uppercase tracking-wide"
              >
                <Camera className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                Clock In with Photo
              </button>
            ) : !isClockedOut ? (
              <button
                type="button"
                onClick={() => setModalType('Clock Out')}
                className="w-full sm:w-auto justify-center bg-gradient-to-r from-neutral-900 via-zinc-900 to-black hover:from-black hover:to-neutral-900 text-amber-300 border-2 border-amber-400/50 font-black px-7 py-3.5 rounded-2xl shadow-lg shadow-black/40 hover:shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 text-sm transition-all duration-200 uppercase tracking-wide"
              >
                <Camera className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                Clock Out with Photo
              </button>
            ) : (
              <div className="w-full sm:w-auto justify-center flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-5 py-3 rounded-2xl shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Shift Logged ({todayRecord.totalHours} hrs)
              </div>
            )}
          </div>
        </div>

        {/* Detailed Timeline of Today */}
        {todayRecord && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            
            {/* Clock-In Log Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-start gap-4">
              {todayRecord.clockIn?.photo ? (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhoto({
                      url: todayRecord.clockIn.photo,
                      title: 'Clock-In Selfie',
                      time: todayRecord.clockIn.timestamp,
                    })
                  }
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-indigo-200 shadow-sm hover:opacity-90 relative group"
                >
                  <img
                    src={getPhotoUrl(todayRecord.clockIn.photo)}
                    alt="Clock in selfie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                    View
                  </div>
                </button>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Camera className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Clock In Time
                  </span>
                  {todayRecord.clockIn?.location && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {todayRecord.clockIn.location}
                    </span>
                  )}
                </div>
                <div className="text-base font-black text-slate-800 mt-0.5">
                  {new Date(todayRecord.clockIn.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {todayRecord.clockIn?.note && (
                  <p className="text-xs text-slate-500 italic mt-1 truncate">
                    "{todayRecord.clockIn.note}"
                  </p>
                )}
              </div>
            </div>

            {/* Clock-Out Log Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-start gap-4">
              {todayRecord.clockOut?.photo ? (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhoto({
                      url: todayRecord.clockOut.photo,
                      title: 'Clock-Out Selfie',
                      time: todayRecord.clockOut.timestamp,
                    })
                  }
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-purple-200 shadow-sm hover:opacity-90 relative group"
                >
                  <img
                    src={getPhotoUrl(todayRecord.clockOut.photo)}
                    alt="Clock out selfie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                    View
                  </div>
                </button>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <LogOut className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Clock Out Time
                </span>
                <div className="text-base font-black text-slate-800 mt-0.5">
                  {todayRecord.clockOut?.timestamp
                    ? new Date(todayRecord.clockOut.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Pending Punch Out'}
                </div>
                {todayRecord.totalHours > 0 && (
                  <p className="text-xs font-semibold text-emerald-600 mt-1">
                    Total Worked: {todayRecord.totalHours} hrs
                  </p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Monthly Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Present Days</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {monthStats?.totalPresent || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">This Month</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Late Marks</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {monthStats?.totalLate || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Grace: 15 mins</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Half-Days</div>
          <div className="text-2xl font-black text-orange-600 mt-1">
            {monthStats?.totalHalfDay || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">&lt; 4.5 hrs shift</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Hours</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {monthStats?.totalHours || 0} hrs
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Logged work</div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={Boolean(modalType)}
        actionType={modalType}
        onClose={() => setModalType(null)}
        onConfirm={handleClockAction}
      />

      {/* Photo Inspector Modal */}
      {selectedPhoto && (
        <PhotoModal
          photoUrl={selectedPhoto.url}
          title={selectedPhoto.title}
          meta={{
            employee: user?.name,
            employeeId: user?.employeeId,
            time: selectedPhoto.time,
          }}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

    </div>
  );
}

