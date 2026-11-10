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
  Lock,
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthStats, setMonthStats] = useState(null);
  const [modalType, setModalType] = useState(null); // 'Clock In' | 'Clock Out' | 'Late / Forgot Check-In' | 'Forgot Check-Out' | null
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [toast, setToast] = useState(null);
  const [serverRules, setServerRules] = useState({
    isPastCheckInCutoff: false,
    isPastCheckOutCutoff: false,
    isCheckInLocked: false,
    isCheckOutLocked: false,
    checkInCutoff: '09:45 AM',
    checkOutCutoff: '07:00 PM',
  });
  const [exceptionQuota, setExceptionQuota] = useState({
    limit: 3,
    used: 0,
    remaining: 3,
    month: '',
  });

  const getPunchWindowStatus = () => {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    // 09:45 AM cutoff -> 585 minutes
    const isPastCheckInCutoff = serverRules.isPastCheckInCutoff || totalMinutes > 9 * 60 + 45;
    // 07:00 PM cutoff -> 1140 minutes
    const isPastCheckOutCutoff = serverRules.isPastCheckOutCutoff || totalMinutes > 19 * 60;
    const hasRemainingExceptions = (exceptionQuota?.remaining ?? 3) > 0;
    return { isPastCheckInCutoff, isPastCheckOutCutoff, hasRemainingExceptions };
  };

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data.success) {
        setTodayRecord(res.data.data);
        if (res.data.rules) {
          setServerRules(res.data.rules);
        }
        if (res.data.exceptionQuota) {
          setExceptionQuota(res.data.exceptionQuota);
        }
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
        const { isPastCheckInCutoff, isPastCheckOutCutoff, hasRemainingExceptions } = getPunchWindowStatus();
        if (!currRecord?.clockIn?.timestamp) {
          if (isPastCheckInCutoff) {
            if (!hasRemainingExceptions) {
              showToast('Monthly limit of 3 Late / Forgot Check-ins exhausted. Closed until next month.', 'error');
              return currRecord;
            }
            setModalType('Late / Forgot Check-In');
            return currRecord;
          }
          setModalType('Clock In');
        } else if (!currRecord?.clockOut?.timestamp) {
          if (isPastCheckOutCutoff) {
            if (!hasRemainingExceptions) {
              showToast('Monthly limit of 3 Late / Forgot punch allowances exhausted. Closed until next month.', 'error');
              return currRecord;
            }
            setModalType('Forgot Check-Out');
            return currRecord;
          }
          setModalType('Clock Out');
        }
        return currRecord;
      });
    };

    window.addEventListener('open-punch-modal', handleOpenPunchModal);
    return () => window.removeEventListener('open-punch-modal', handleOpenPunchModal);
  }, [serverRules, exceptionQuota]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleClockAction = async ({ photo, note, location, punchType }) => {
    const { isPastCheckInCutoff, isPastCheckOutCutoff, hasRemainingExceptions } = getPunchWindowStatus();

    const isClockInAction = modalType?.includes('Clock In') || modalType?.includes('Check-In');

    if (isClockInAction && isPastCheckInCutoff && !hasRemainingExceptions) {
      showToast('Monthly limit of 3 Late / Forgot Check-ins exhausted. Closed until next month.', 'error');
      setModalType(null);
      return;
    }

    if (!isClockInAction && isPastCheckOutCutoff && !hasRemainingExceptions) {
      showToast('Monthly limit of 3 Late / Forgot punch allowances exhausted. Closed until next month.', 'error');
      setModalType(null);
      return;
    }

    try {
      if (isClockInAction) {
        const res = await api.post('/attendance/clock-in', {
          photo,
          note,
          location: location || 'Office',
          punchType: isPastCheckInCutoff ? (punchType || 'Late Check-In') : (punchType || 'Regular'),
        });
        showToast(res.data.message || 'Clocked In Successfully!');
      } else {
        const res = await api.post('/attendance/clock-out', {
          photo,
          note,
          location: location || 'Office',
          punchType: isPastCheckOutCutoff ? 'Forgot Check-Out' : (punchType || 'Regular'),
        });
        showToast(res.data.message || 'Clocked Out Successfully!');
      }
      await fetchTodayStatus();
      await fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Action failed', 'error');
      throw err;
    }
  };

  const isPendingApproval = todayRecord?.approvalStatus === 'pending';
  const isClockedIn = Boolean(todayRecord?.clockIn?.timestamp);
  const isClockedOut = Boolean(todayRecord?.clockOut?.timestamp);
  const { isPastCheckInCutoff, isPastCheckOutCutoff, hasRemainingExceptions } = getPunchWindowStatus();

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

      {/* Greeting Banner - Deep Heritage Forest & Warm Sandstone */}
      <div className="relative overflow-hidden bg-[#1B3B34] rounded-2xl p-6 sm:p-8 text-[#FAF6EE] shadow-warm-md flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-[#142E28]">
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2ECE6] text-[#1B3B34] text-xs font-bold mb-3 border border-[#BCD3C5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B3B34]" />
            <span>IT Operations • {user?.department || 'Engineering'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#FAF6EE]">
            Hello, {user?.name || 'Developer'}
          </h1>
          <p className="text-xs sm:text-sm text-[#D8E6DF] mt-1 max-w-lg leading-relaxed">
            Standard shift: <span className="font-bold text-[#FAF6EE]">{user?.shiftStartTime || '09:30'} AM</span> to{' '}
            <span className="font-bold text-[#FAF6EE]">{user?.shiftEndTime || '06:30'} PM</span>. Live camera verification active.
            <br />
            <span className="inline-block mt-2 text-[11px] font-semibold text-[#1B3B34] bg-[#E2ECE6] px-2.5 py-0.5 rounded-lg border border-[#BCD3C5]">
              Shift Timings: Check-in before <span className="font-bold">09:45 AM</span> • Check-out before <span className="font-bold">07:00 PM</span>
            </span>
          </p>
        </div>

        {/* Date Card */}
        <div className="relative z-10 bg-[#142E28] border border-[#234A42] rounded-xl p-4 text-center sm:text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-[#BCD3C5] font-extrabold">TODAY'S TIMELINE</div>
          <div className="text-base sm:text-lg font-black text-[#FAF6EE] mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-[11px] text-[#A6C4B9] mt-0.5 flex items-center justify-center sm:justify-end gap-1">
            <MapPin className="w-3 h-3 text-[#E2ECE6]" />
            JAC MediaLand Hub
          </div>
        </div>
      </div>

      {/* Monthly Exception Quota Card: 3 passes for Late / Forgot Punch */}
      <div className="bg-[#FAF6EE] border border-[#DCD4C4] rounded-2xl p-5 sm:p-6 shadow-warm-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#EAE4D6] border border-[#DCD4C4] flex items-center justify-center text-[#1B3B34] shrink-0">
            <Clock className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#23201B]">Late & Forgot Punch Allowance</span>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#EAE4D6] text-[#5A5347] border border-[#DCD4C4]">
                {exceptionQuota.month || 'Monthly Quota'}
              </span>
            </div>
            <p className="text-xs text-[#5A5347] mt-0.5">
              Up to <span className="text-[#C25E37] font-bold">3 allowances</span> per month for late arrivals (past 9:45 AM) or missed punches. Resets on the 1st.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#EAE4D6] px-4 py-2.5 rounded-xl border border-[#DCD4C4] self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((num) => {
              const isAvailable = num <= (exceptionQuota.remaining ?? 3);
              return (
                <span
                  key={num}
                  title={isAvailable ? `Allowance ${num} Available` : `Allowance ${num} Used`}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    isAvailable
                      ? 'bg-[#C25E37] border-[#AA4F2C]'
                      : 'bg-[#DCD4C4] border-[#C8BEAD] opacity-40'
                  }`}
                />
              );
            })}
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-[#C25E37]">
              {exceptionQuota.remaining ?? 3} / {exceptionQuota.limit ?? 3}
            </span>
            <span className="text-[10px] text-[#5A5347] block font-semibold">passes left</span>
          </div>
        </div>
      </div>

      {/* Primary Action Card: Clock In / Clock Out */}
      <div className="bg-[#FAF6EE] rounded-2xl p-6 sm:p-8 border border-[#DCD4C4] shadow-warm-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#DCD4C4]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#8A8274]">PUNCH STATUS</span>
              {isPendingApproval ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F6EFE2] text-[#8A5C1E] border border-[#E5D3B8] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Approval Pending
                </span>
              ) : todayRecord ? (
                <StatusBadge status={todayRecord.status} />
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAE4D6] text-[#5A5347] border border-[#DCD4C4]">
                  Not Marked Yet
                </span>
              )}
              {todayRecord?.exceptionType && todayRecord.exceptionType !== 'none' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F6E7DF] text-[#C25E37] border border-[#EAC7BF]">
                  {todayRecord.exceptionType}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#23201B] mt-1 tracking-tight">
              {isPendingApproval
                ? `🕒 ${todayRecord.pendingRequest?.requestType || 'Punch'} Request Sent to Admin`
                : !isClockedIn
                ? isPastCheckInCutoff
                  ? hasRemainingExceptions
                    ? '🕒 Late / Forgot Check-In Available'
                    : '⚠️ Check-In Closed (Monthly Quota Reached)'
                  : 'Ready to clock in for your shift?'
                : !isClockedOut
                ? isPastCheckOutCutoff
                  ? hasRemainingExceptions
                    ? '🕒 Forgot Check-Out Available'
                    : '⚠️ Check-Out Closed (Monthly Quota Reached)'
                  : '🟢 Active Shift in Progress'
                : '✨ Day Completed — Great Work!'}
            </h2>
            <p className="text-xs text-[#5A5347] mt-0.5">
              {isPendingApproval
                ? `Your ${todayRecord.pendingRequest?.requestType} was sent with your photo and explanation note. Once Admin approves, your punch will be automatically recorded!`
                : !isClockedIn
                ? isPastCheckInCutoff
                  ? hasRemainingExceptions
                    ? `It is past 09:45 AM. You have ${exceptionQuota.remaining} of 3 monthly Late/Forgot passes remaining. Capture photo & provide note to send to Admin.`
                    : 'You have used all 3 Late / Forgot Check-in allowances for this month. Check-in is locked until the 1st of next month.'
                  : 'Standard shift check-in active (cutoff: 09:45 AM). Capture photo to log punch.'
                : !isClockedOut
                ? isPastCheckOutCutoff
                  ? hasRemainingExceptions
                    ? `It is past 07:00 PM. You have ${exceptionQuota.remaining} of 3 monthly allowances available to request checkout from Admin.`
                    : 'You have used all 3 Late / Forgot punch allowances for this month. Please contact Admin or HR.'
                  : 'Your shift is currently active. Snap your selfie when clocking out at end of workday (cutoff: 07:00 PM).'
                : 'All shift logs and hours have been recorded in the enterprise registry.'}
            </p>
          </div>

          {/* Action Trigger Button - Warm Terracotta Accent */}
          <div className="w-full sm:w-auto">
            {isPendingApproval ? (
              <div className="w-full sm:w-auto justify-center flex items-center gap-2 bg-[#F6EFE2] border border-[#E5D3B8] text-[#8A5C1E] text-xs font-bold px-5 py-3.5 rounded-xl shadow-xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Awaiting Admin Approval</span>
              </div>
            ) : !isClockedIn ? (
              isPastCheckInCutoff ? (
                hasRemainingExceptions ? (
                  <button
                    type="button"
                    onClick={() => setModalType('Late / Forgot Check-In')}
                    className="w-full sm:w-auto justify-center bg-[#C25E37] hover:bg-[#AA4F2C] text-[#FAF6EE] font-black px-6 py-3.5 rounded-xl shadow-warm-sm flex items-center gap-2.5 text-xs transition-all uppercase tracking-wider active:scale-95"
                  >
                    <Clock className="w-4 h-4 stroke-[2.5]" />
                    <span>Late / Forgot Check-In ({exceptionQuota.remaining}/3 Left)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        'Monthly limit of 3 Late / Forgot Check-ins reached. Check-in after 09:45 AM is closed until the 1st of next month.',
                        'error'
                      )
                    }
                    className="w-full sm:w-auto justify-center bg-[#EAE4D6] text-[#8A8274] border border-[#DCD4C4] font-bold px-7 py-3.5 rounded-xl flex items-center gap-3 text-xs transition-all uppercase tracking-wide cursor-not-allowed"
                    title="0 of 3 monthly allowances left"
                  >
                    <Lock className="w-4 h-4 stroke-[2]" />
                    <span>Check-In Closed (3/3 Limit Reached)</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setModalType('Clock In')}
                  className="w-full sm:w-auto justify-center bg-[#C25E37] hover:bg-[#AA4F2C] text-[#FAF6EE] font-black px-7 py-3.5 rounded-xl shadow-warm-sm flex items-center gap-3 text-xs transition-all uppercase tracking-wide active:scale-95"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  Clock In with Photo
                </button>
              )
            ) : !isClockedOut ? (
              isPastCheckOutCutoff ? (
                hasRemainingExceptions ? (
                  <button
                    type="button"
                    onClick={() => setModalType('Forgot Check-Out')}
                    className="w-full sm:w-auto justify-center bg-[#C25E37] hover:bg-[#AA4F2C] text-[#FAF6EE] font-black px-6 py-3.5 rounded-xl shadow-warm-sm flex items-center gap-2.5 text-xs transition-all uppercase tracking-wider active:scale-95"
                  >
                    <Clock className="w-4 h-4 stroke-[2.5]" />
                    <span>Forgot Check-Out ({exceptionQuota.remaining}/3 Left)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        'Monthly limit of 3 Late / Forgot passes reached. Check-out after 07:00 PM requires admin authorization.',
                        'error'
                      )
                    }
                    className="w-full sm:w-auto justify-center bg-[#EAE4D6] text-[#8A8274] border border-[#DCD4C4] font-bold px-7 py-3.5 rounded-xl flex items-center gap-3 text-xs transition-all uppercase tracking-wide cursor-not-allowed"
                    title="0 of 3 monthly allowances left"
                  >
                    <Lock className="w-4 h-4 stroke-[2]" />
                    <span>Check-Out Closed (3/3 Limit Reached)</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setModalType('Clock Out')}
                  className="w-full sm:w-auto justify-center bg-[#1B3B34] hover:bg-[#142E28] text-[#FAF6EE] font-black px-7 py-3.5 rounded-xl shadow-warm-sm flex items-center gap-3 text-xs transition-all uppercase tracking-wide active:scale-95"
                >
                  <LogOut className="w-4 h-4 stroke-[2.5]" />
                  Clock Out with Photo
                </button>
              )
            ) : (
              <div className="w-full sm:w-auto justify-center flex items-center gap-2 bg-[#E2ECE6] border border-[#BCD3C5] text-[#1B3B34] text-xs font-bold px-5 py-3 rounded-xl shadow-xs">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Shift Completed Today</span>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Timeline of Today */}
        {todayRecord && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            
            {/* Clock-In Log Card */}
            <div className="p-4 bg-[#EAE4D6] rounded-xl border border-[#DCD4C4] flex items-start gap-4">
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
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#DCD4C4] shadow-xs hover:opacity-90 relative group"
                >
                  <img
                    src={getPhotoUrl(todayRecord.clockIn.photo)}
                    alt="Clock in selfie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#23201B]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#FAF6EE] text-[10px] font-bold transition-opacity">
                    View
                  </div>
                </button>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#DCD4C4] flex items-center justify-center text-[#8A8274] shrink-0">
                  <Camera className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#8A8274] uppercase tracking-wider">
                    Clock In Time
                  </span>
                  {todayRecord.clockIn?.location && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E2ECE6] text-[#1B3B34] border border-[#BCD3C5]">
                      {todayRecord.clockIn.location}
                    </span>
                  )}
                </div>
                <div className="text-base font-black text-[#23201B] mt-0.5">
                  {new Date(todayRecord.clockIn.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {todayRecord.clockIn?.note && (
                  <p className="text-xs text-[#5A5347] italic mt-1 truncate">
                    "{todayRecord.clockIn.note}"
                  </p>
                )}
              </div>
            </div>

            {/* Clock-Out Log Card */}
            <div className="p-4 bg-[#EAE4D6] rounded-xl border border-[#DCD4C4] flex items-start gap-4">
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
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#DCD4C4] shadow-xs hover:opacity-90 relative group"
                >
                  <img
                    src={getPhotoUrl(todayRecord.clockOut.photo)}
                    alt="Clock out selfie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#23201B]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#FAF6EE] text-[10px] font-bold transition-opacity">
                    View
                  </div>
                </button>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#DCD4C4] flex items-center justify-center text-[#8A8274] shrink-0">
                  <LogOut className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-[#8A8274] uppercase tracking-wider">
                  Clock Out Time
                </span>
                <div className="text-base font-black text-[#23201B] mt-0.5">
                  {todayRecord.clockOut?.timestamp
                    ? new Date(todayRecord.clockOut.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Pending Punch Out'}
                </div>
                {todayRecord.totalHours > 0 && (
                  <p className="text-xs font-semibold text-[#1B3B34] mt-1">
                    Total Worked: {todayRecord.totalHours} hrs
                  </p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Monthly Statistics Overview - Warm Bisque Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
          <div className="text-[#8A8274] text-xs font-semibold uppercase tracking-wider">Present Days</div>
          <div className="text-2xl font-black text-[#1B3B34] mt-1">
            {monthStats?.totalPresent || 0}
          </div>
          <div className="text-[11px] text-[#5A5347] mt-0.5">This Month</div>
        </div>

        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
          <div className="text-[#8A8274] text-xs font-semibold uppercase tracking-wider">Late Marks</div>
          <div className="text-2xl font-black text-[#B88B42] mt-1">
            {monthStats?.totalLate || 0}
          </div>
          <div className="text-[11px] text-[#5A5347] mt-0.5">Grace: 15 mins</div>
        </div>

        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
          <div className="text-[#8A8274] text-xs font-semibold uppercase tracking-wider">Half-Days</div>
          <div className="text-2xl font-black text-[#C25E37] mt-1">
            {monthStats?.totalHalfDay || 0}
          </div>
          <div className="text-[11px] text-[#5A5347] mt-0.5">&lt; 4.5 hrs shift</div>
        </div>

        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
          <div className="text-[#8A8274] text-xs font-semibold uppercase tracking-wider">Total Hours</div>
          <div className="text-2xl font-black text-[#23201B] mt-1">
            {monthStats?.totalHours || 0} hrs
          </div>
          <div className="text-[11px] text-[#5A5347] mt-0.5">Logged work</div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={Boolean(modalType)}
        actionType={modalType}
        isException={
          modalType?.includes('Late') ||
          modalType?.includes('Forgot') ||
          (modalType === 'Clock In' && isPastCheckInCutoff)
        }
        remainingExceptions={exceptionQuota?.remaining ?? 3}
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

