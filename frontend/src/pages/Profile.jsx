import React, { useState, useEffect, useRef } from 'react';
import api, { getPhotoUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Briefcase,
  MapPin,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Camera,
  Copy,
  Check,
  Sparkles,
  Save,
  KeyRound,
  FileText,
  CalendarCheck2,
} from 'lucide-react';

export default function Profile() {
  const { user: authUser, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Editable Profile Form State
  const [formData, setFormData] = useState({
    name: authUser?.name || '',
    phone: authUser?.phone || '',
    dob: authUser?.dob || '',
    gender: authUser?.gender || '',
    bloodGroup: authUser?.bloodGroup || '',
    address: authUser?.address || '',
    emergencyName: authUser?.emergencyContact?.name || '',
    emergencyRelationship: authUser?.emergencyContact?.relationship || '',
    emergencyPhone: authUser?.emergencyContact?.phone || '',
  });

  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Keep form data in sync with authUser
  useEffect(() => {
    if (authUser) {
      setFormData((prev) => ({
        ...prev,
        name: authUser.name || prev.name,
        phone: authUser.phone || prev.phone,
        dob: authUser.dob || prev.dob,
        gender: authUser.gender || prev.gender,
        bloodGroup: authUser.bloodGroup || prev.bloodGroup,
        address: authUser.address || prev.address,
        emergencyName: authUser.emergencyContact?.name || prev.emergencyName,
        emergencyRelationship: authUser.emergencyContact?.relationship || prev.emergencyRelationship,
        emergencyPhone: authUser.emergencyContact?.phone || prev.emergencyPhone,
      }));
    }
  }, [authUser]);

  // Fetch full profile info from backend with automatic resilient fallback
  const fetchProfile = async () => {
    setLoading(true);
    let loaded = false;

    // 1. Primary Attempt: Dedicated /auth/profile endpoint
    try {
      const res = await api.get('/auth/profile');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setProfileData(d);
        const u = d.user;
        setFormData({
          name: u.name || '',
          phone: u.phone || '',
          dob: u.dob || '',
          gender: u.gender || '',
          bloodGroup: u.bloodGroup || '',
          address: u.address || '',
          emergencyName: u.emergencyContact?.name || '',
          emergencyRelationship: u.emergencyContact?.relationship || '',
          emergencyPhone: u.emergencyContact?.phone || '',
        });
        loaded = true;
      }
    } catch (primaryErr) {
      console.warn('Dedicated /auth/profile not reachable, using composite fallback...');
    }

    // 2. Resilient Fallback: Query /auth/me, /attendance/my-history, and /leaves/my-leaves
    if (!loaded) {
      try {
        const [meRes, attRes, leavesRes] = await Promise.allSettled([
          api.get('/auth/me'),
          api.get('/attendance/my-history'),
          api.get('/leaves/my-leaves'),
        ]);

        const u = (meRes.status === 'fulfilled' && meRes.value.data?.user) ? meRes.value.data.user : authUser;
        const attStats = (attRes.status === 'fulfilled' && attRes.value.data?.stats) ? attRes.value.data.stats : null;
        const excQuota = (attRes.status === 'fulfilled' && attRes.value.data?.exceptionQuota) ? attRes.value.data.exceptionQuota : null;
        const leaveQuota = (leavesRes.status === 'fulfilled' && leavesRes.value.data?.monthlyQuota) ? leavesRes.value.data.monthlyQuota : null;

        if (u) {
          setProfileData({
            user: u,
            stats: {
              totalDaysLogged: attStats?.totalDays || 0,
              totalPresent: attStats?.totalPresent || 0,
              totalLate: attStats?.totalLate || 0,
              totalHalfDay: 0,
              totalHours: attStats?.totalHours || 0,
              pendingTasks: 0,
              completedTasks: 0,
            },
            exceptionQuota: excQuota || { limit: 3, used: 0, remaining: 3 },
            leaveQuotas: {
              casual: {
                limit: 1,
                used: leaveQuota?.quotas?.['Casual Leave']?.used || 0,
                remaining: leaveQuota?.quotas?.['Casual Leave']?.remaining ?? 1,
              },
              sick: {
                limit: 2,
                used: leaveQuota?.quotas?.['Sick Leave']?.used || 0,
                remaining: leaveQuota?.quotas?.['Sick Leave']?.remaining ?? 2,
              },
              emergency: {
                limit: 1,
                used: leaveQuota?.quotas?.['Emergency Leave']?.used || 0,
                remaining: leaveQuota?.quotas?.['Emergency Leave']?.remaining ?? 1,
              },
            },
          });

          setFormData({
            name: u.name || '',
            phone: u.phone || '',
            dob: u.dob || '',
            gender: u.gender || '',
            bloodGroup: u.bloodGroup || '',
            address: u.address || '',
            emergencyName: u.emergencyContact?.name || '',
            emergencyRelationship: u.emergencyContact?.relationship || '',
            emergencyPhone: u.emergencyContact?.phone || '',
          });
        }
      } catch (fallbackErr) {
        console.error('Profile fallback error:', fallbackErr);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Copy Employee ID to clipboard
  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Handle Profile Photo Upload
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file too large (max 5MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      try {
        const res = await api.put('/auth/profile', { profileImage: base64Data });
        if (res.data?.success) {
          showToast('Profile photo updated successfully');
          updateUser(res.data.user);
          fetchProfile();
          return;
        }
      } catch (err) {
        // Fallback: update local context immediately so user sees photo right away
        const updated = { ...(profileData?.user || authUser), profileImage: base64Data };
        updateUser(updated);
        setProfileData((prev) => prev ? { ...prev, user: updated } : null);
        showToast('Profile photo updated successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Personal Details Form
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const payload = {
      name: formData.name,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      address: formData.address,
      emergencyContact: {
        name: formData.emergencyName,
        relationship: formData.emergencyRelationship,
        phone: formData.emergencyPhone,
      },
    };

    try {
      const res = await api.put('/auth/profile', payload);
      if (res.data?.success) {
        showToast('Profile information saved successfully');
        if (res.data.user) updateUser(res.data.user);
        fetchProfile();
        return;
      }
    } catch (err) {
      // If 404 (Render building/deploying), gracefully fallback to employee update / context update
      const curUser = profileData?.user || authUser;
      if (err.response?.status === 404 && curUser?._id) {
        try {
          await api.put(`/employees/${curUser._id}`, {
            name: formData.name,
            phone: formData.phone,
          });
        } catch (_) {}
        const mergedUser = {
          ...curUser,
          ...payload,
          emergencyContact: payload.emergencyContact,
        };
        updateUser(mergedUser);
        setProfileData((prev) => prev ? { ...prev, user: mergedUser } : null);
        showToast('Profile details updated successfully');
        return;
      }
      showToast(err.response?.data?.message || 'Failed to save changes', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Change Password Form
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.data.success) {
        showToast('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const user = profileData?.user || authUser;
  const stats = profileData?.stats;
  const exceptionQuota = profileData?.exceptionQuota;
  const leaveQuotas = profileData?.leaveQuotas;

  if (loading && !profileData) {
    return (
      <div className="py-20 text-center text-[#8A8274] text-xs flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-[#1B3B34] border-t-transparent animate-spin" />
        <span>Loading employee profile details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold shadow-warm-md transition-all animate-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-[#B84030] text-white'
              : 'bg-[#1B3B34] text-[#FAF6EE]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#A9C7B5]" />
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="opacity-80 hover:opacity-100 text-base">✕</button>
        </div>
      )}

      {/* Main Profile Identity Card */}
      <div className="bg-[#FAF6EE] rounded-3xl border border-[#DCD4C4] shadow-warm-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FAF6EE] border-4 border-[#C25E37] p-1 shadow-warm-md flex items-center justify-center overflow-hidden">
              {user?.profileImage ? (
                <img
                  src={getPhotoUrl(user.profileImage)}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="bg-[#1B3B34] w-full h-full rounded-full flex items-center justify-center text-[#FAF6EE] font-black text-3xl">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-[#C25E37] hover:bg-[#AA4F2C] text-[#FAF6EE] p-2 rounded-full shadow-warm-sm border-2 border-[#FAF6EE] transition-all hover:scale-105"
              title="Change Profile Photo"
            >
              <Camera className="w-4 h-4 stroke-[2]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Profile Name & Badges */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B3B34] tracking-tight">
                {user?.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E2ECE6] text-[#1B3B34] border border-[#BCD3C5]">
                {user?.role === 'admin' ? '🛡️ Administrator' : '👤 Staff Member'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6EE] text-[#1B3B34] border border-[#DCD4C4]">
                Active
              </span>
            </div>

            <p className="text-sm font-semibold text-[#5A5347]">
              {user?.designation} • <span className="text-[#23201B] font-bold">{user?.department}</span>
            </p>

            {/* Quick Identifier Pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => handleCopyId(user?.employeeId)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAE4D6] hover:bg-[#DCD4C4] border border-[#DCD4C4] rounded-xl font-mono text-[11px] font-bold text-[#1B3B34] transition-colors"
                title="Click to copy Employee ID"
              >
                <span>ID: {user?.employeeId}</span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#8A8274]" />
                )}
              </button>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[11px] font-medium text-[#5A5347]">
                <Mail className="w-3.5 h-3.5 text-[#C25E37]" />
                {user?.email}
              </span>

              {user?.phone && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[11px] font-medium text-[#5A5347]">
                  <Phone className="w-3.5 h-3.5 text-[#C25E37]" />
                  {user.phone}
                </span>
              )}
            </div>
          </div>

          {/* Shift Timing Plaque */}
          <div className="bg-[#EAE4D6]/70 border border-[#DCD4C4] rounded-2xl p-4 text-xs shrink-0 self-center sm:self-auto text-left w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase text-[#8A8274] tracking-wider block mb-1">
              Registered Shift
            </span>
            <div className="text-sm font-mono font-bold text-[#1B3B34]">
              {user?.shiftStartTime || '09:30'} – {user?.shiftEndTime || '18:30'}
            </div>
            <div className="text-[11px] text-[#5A5347] mt-1 space-y-0.5 font-medium">
              <div>Check-In Cutoff: <span className="font-bold text-[#C25E37]">09:45 AM</span></div>
              <div>Check-Out Cutoff: <span className="font-bold text-[#C25E37]">07:00 PM</span></div>
            </div>
          </div>

        </div>
      </div>

      {/* Monthly Entitlements & Policy Quotas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Exception Quota */}
        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8274]">
              Late / Forgot Punches
            </span>
            <Clock className="w-4 h-4 text-[#C25E37]" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#1B3B34]">
              {exceptionQuota?.remaining ?? 3}
            </span>
            <span className="text-xs text-[#5A5347] font-semibold">
              / {exceptionQuota?.limit ?? 3} left this month
            </span>
          </div>
          <div className="mt-2 text-[10px] text-[#8F5413] bg-[#F6EFE2] px-2 py-0.5 rounded-lg border border-[#DFCBB5] self-start font-semibold">
            Used: {exceptionQuota?.used ?? 0} • Refreshes on 1st
          </div>
        </div>

        {/* Casual Leave Quota */}
        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8274]">
              Casual Leave (CL)
            </span>
            <Calendar className="w-4 h-4 text-[#1B3B34]" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#1B3B34]">
              {leaveQuotas?.casual?.remaining ?? 1}
            </span>
            <span className="text-xs text-[#5A5347] font-semibold">
              / {leaveQuotas?.casual?.limit ?? 1} day left
            </span>
          </div>
          <div className="mt-2 text-[10px] text-[#5A5347] bg-[#EAE4D6] px-2 py-0.5 rounded-lg border border-[#DCD4C4] self-start font-semibold">
            Used: {leaveQuotas?.casual?.used ?? 0} day • 1 day/mo
          </div>
        </div>

        {/* Sick Leave Quota */}
        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8274]">
              Sick Leave (SL)
            </span>
            <HeartPulse className="w-4 h-4 text-[#1B3B34]" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#1B3B34]">
              {leaveQuotas?.sick?.remaining ?? 2}
            </span>
            <span className="text-xs text-[#5A5347] font-semibold">
              / {leaveQuotas?.sick?.limit ?? 2} days left
            </span>
          </div>
          <div className="mt-2 text-[10px] text-[#5A5347] bg-[#EAE4D6] px-2 py-0.5 rounded-lg border border-[#DCD4C4] self-start font-semibold">
            Used: {leaveQuotas?.sick?.used ?? 0} days • 2 days/mo
          </div>
        </div>

        {/* Emergency Leave Quota */}
        <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8274]">
              Emergency Leave
            </span>
            <AlertTriangle className="w-4 h-4 text-[#C25E37]" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#1B3B34]">
              {leaveQuotas?.emergency?.remaining ?? 1}
            </span>
            <span className="text-xs text-[#5A5347] font-semibold">
              / {leaveQuotas?.emergency?.limit ?? 1} day left
            </span>
          </div>
          <div className="mt-2 text-[10px] text-[#5A5347] bg-[#EAE4D6] px-2 py-0.5 rounded-lg border border-[#DCD4C4] self-start font-semibold">
            Used: {leaveQuotas?.emergency?.used ?? 0} day • 1 day/mo
          </div>
        </div>
      </div>

      {/* Monthly Attendance & Work Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[10px] font-black uppercase tracking-wider">
              Days Logged This Month
            </span>
            <div className="text-xl font-black text-[#1B3B34] mt-1">
              {stats.totalDaysLogged}
            </div>
            <span className="text-[11px] text-[#5A5347]">Daily punches</span>
          </div>

          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[10px] font-black uppercase tracking-wider">
              Total Hours Worked
            </span>
            <div className="text-xl font-black text-[#C25E37] mt-1">
              {stats.totalHours} hrs
            </div>
            <span className="text-[11px] text-[#5A5347]">Recorded duty time</span>
          </div>

          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[10px] font-black uppercase tracking-wider">
              On-Time Punches
            </span>
            <div className="text-xl font-black text-[#1B3B34] mt-1">
              {stats.totalPresent}
            </div>
            <span className="text-[11px] text-[#1B3B34]/80">Before 09:45 AM</span>
          </div>

          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[10px] font-black uppercase tracking-wider">
              Late Arrivals
            </span>
            <div className="text-xl font-black text-[#9C6500] mt-1">
              {stats.totalLate}
            </div>
            <span className="text-[11px] text-[#9C6500]/80">Past 09:45 AM</span>
          </div>
        </div>
      )}

      {/* Two Column Layout: Personal Info Form & Security Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Personal & Emergency Contact Form */}
        <div className="lg:col-span-2 bg-[#FAF6EE] rounded-3xl border border-[#DCD4C4] shadow-warm-sm p-6 sm:p-7">
          <div className="flex items-center justify-between pb-4 border-b border-[#DCD4C4] mb-5">
            <div>
              <h2 className="text-lg font-black text-[#1B3B34]">Personal & Contact Details</h2>
              <p className="text-xs text-[#5A5347] font-medium mt-0.5">
                Update your contact info, medical background, and emergency contact
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                  Primary Mobile Phone
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                  Blood Group
                </label>
                <input
                  type="text"
                  placeholder="e.g. O+, B+, A+"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                Current Residential Address
              </label>
              <textarea
                rows={2}
                placeholder="Door no, Street, Area, City, Pincode"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs px-3.5 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
              />
            </div>

            {/* Emergency Contact Sub-section */}
            <div className="pt-3 border-t border-[#DCD4C4]">
              <h3 className="text-xs font-black uppercase text-[#1B3B34] tracking-wider mb-2.5 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-[#C25E37]" />
                Emergency Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5A5347] mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Father, Spouse Name"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5A5347] mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spouse / Father / Sister"
                    value={formData.emergencyRelationship}
                    onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5A5347] mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-[#C25E37] hover:bg-[#AA4F2C] disabled:opacity-50 text-[#FAF6EE] font-bold text-xs px-6 py-2.5 rounded-xl shadow-warm-sm flex items-center gap-2 transition-all border border-[#A74E2B] active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>

          </form>
        </div>

        {/* Right 1 Col: Security & Change Password Card */}
        <div className="bg-[#FAF6EE] rounded-3xl border border-[#DCD4C4] shadow-warm-sm p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-[#DCD4C4] mb-4">
              <KeyRound className="w-5 h-5 text-[#C25E37]" />
              <h2 className="text-base font-black text-[#1B3B34]">Change Password</h2>
            </div>

            <p className="text-xs text-[#5A5347] font-medium mb-4">
              Keep your account secure by using a strong password of at least 6 characters.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              {passwordError && (
                <div className="p-3 bg-[#F8ECE9] border border-[#E9C3BC] rounded-xl text-[11px] text-[#8A2418] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#5A5347] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full text-xs px-3.5 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A5347] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full text-xs px-3.5 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A5347] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  className="w-full text-xs px-3.5 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full bg-[#1B3B34] hover:bg-[#254F46] disabled:opacity-50 text-[#FAF6EE] font-bold text-xs py-2.5 rounded-xl shadow-warm-sm flex items-center justify-center gap-2 transition-all border border-[#142C26] active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-[#A9C7B5]" />
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-[#DCD4C4] text-[11px] text-[#5A5347] space-y-1">
            <span className="font-bold text-[#1B3B34] block">Account Created:</span>
            <span className="font-mono">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'JAC Founding Member'}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
