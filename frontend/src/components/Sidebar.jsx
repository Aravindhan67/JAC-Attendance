import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPhotoUrl } from '../api/client';
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarOff,
  Users,
  Camera,
  CheckSquare,
  User,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Event listeners for toggle / open / close from navbar or anywhere
  useEffect(() => {
    const handleOpen = () => setIsMobileOpen(true);
    const handleClose = () => setIsMobileOpen(false);
    const handleToggle = () => setIsMobileOpen((prev) => !prev);

    window.addEventListener('open-mobile-sidebar', handleOpen);
    window.addEventListener('close-mobile-sidebar', handleClose);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-mobile-sidebar', handleOpen);
      window.removeEventListener('close-mobile-sidebar', handleClose);
      window.removeEventListener('toggle-mobile-sidebar', handleToggle);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const employeeLinks = [
    { to: '/', label: 'Clock In / Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/my-attendance', label: 'My Attendance', icon: CalendarCheck2 },
    { to: '/my-leaves', label: 'My Leaves', icon: CalendarOff },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard },
    { to: '/admin/tasks', label: 'Task Manager', icon: CheckSquare },
    { to: '/admin/attendance', label: 'Attendance & Photos', icon: Camera },
    { to: '/admin/leaves', label: 'Leave Approvals', icon: CalendarOff },
    { to: '/admin/employees', label: 'Manage Staff', icon: Users },
  ];

  const renderNavGroup = (title, links, onItemClick) => (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-wider font-extrabold text-[#8A8274] px-3 mb-2">
        {title}
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/admin'}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1B3B34] text-[#FAF6EE] shadow-xs'
                    : 'text-[#5A5347] hover:text-[#23201B] hover:bg-[#EAE4D6]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* ============================================================ */}
      {/* 1. DESKTOP PERMANENT ASIDE (VISIBLE ON md: SCREENS AND ABOVE) */}
      {/* ============================================================ */}
      <aside className="w-64 bg-[#FAF6EE] border-r border-[#DCD4C4] p-4 shrink-0 hidden md:block min-h-[calc(100vh-4rem)]">
        {/* Employee navigation */}
        {renderNavGroup('Employee Workspace', employeeLinks)}

        {/* Admin specific navigation */}
        {isAdmin && renderNavGroup('Admin Management', adminLinks)}

        {/* Office Shift Timing Card */}
        <div className="mt-auto pt-6 border-t border-[#DCD4C4] text-xs">
          <div className="bg-[#EAE4D6] border border-[#DCD4C4] rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C25E37]" />
              <p className="font-extrabold text-[#1B3B34] text-[11px]">Office Shift Policy</p>
            </div>
            <p className="text-[11px] text-[#5A5347] leading-relaxed font-medium">
              Standard: <span className="font-bold text-[#23201B]">09:30 AM – 06:30 PM</span>
              <br />
              Check-In Cutoff: <span className="text-[#C25E37] font-bold">09:45 AM</span>
              <br />
              Check-Out Cutoff: <span className="text-[#C25E37] font-bold">07:00 PM</span>
            </p>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MOBILE SLIDE-IN SIDE NAV DRAWER (VISIBLE ON SMALL SCREENS) */}
      {/* ============================================================ */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop Overlay with warm dimming */}
        <div
          onClick={() => setIsMobileOpen(false)}
          className={`absolute inset-0 bg-[#23201B]/50 backdrop-blur-xs transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        {/* Drawer Panel Sliding In from Left */}
        <div
          className={`relative w-[82vw] max-w-xs h-full bg-[#FAF6EE] border-r border-[#DCD4C4] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Top Header with Logo & Close Button */}
          <div className="p-4 border-b border-[#DCD4C4] flex items-center justify-between bg-[#FAF6EE]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] p-1 shadow-xs border border-[#DCD4C4] flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="/logo.jpg"
                  alt="JAC MediaLand Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-[#1B3B34] text-sm tracking-tight">
                    JAC MediaLand
                  </span>
                  <span className="text-[9px] font-extrabold uppercase bg-[#E2ECE6] text-[#1B3B34] px-1.5 py-0.5 rounded-full">
                    IT Hub
                  </span>
                </div>
                <p className="text-[10px] text-[#5A5347] font-medium">Navigation Menu</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-xl bg-[#EAE4D6] hover:bg-[#DCD4C4] active:scale-95 text-[#5A5347] hover:text-[#23201B] border border-[#DCD4C4] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* User Profile Mini-Banner */}
          {user && (
            <div className="p-3 border-b border-[#DCD4C4] bg-[#F1EDE4]/60">
              <NavLink
                to="/profile"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FAF6EE] border border-[#DCD4C4] shadow-xs group hover:border-[#C25E37] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-[#FAF6EE] border-2 border-[#C25E37] p-0.5 shrink-0 flex items-center justify-center">
                  {user.profileImage ? (
                    <img
                      src={getPhotoUrl(user.profileImage)}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="bg-[#1B3B34] w-full h-full rounded-full flex items-center justify-center text-[#FAF6EE] font-black text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-[#23201B] truncate group-hover:text-[#C25E37] transition-colors">
                      {user.name}
                    </p>
                    {isAdmin ? (
                      <span className="text-[9px] bg-[#1B3B34] text-[#FAF6EE] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5 text-[#E2ECE6]" />
                        Admin
                      </span>
                    ) : (
                      <span className="text-[9px] bg-[#EAE4D6] text-[#5A5347] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                        {user.employeeId}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#5A5347] truncate font-medium mt-0.5">
                    {user.designation || user.department}
                  </p>
                </div>
              </NavLink>
            </div>
          )}

          {/* Scrollable Navigation Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Employee Links */}
            {renderNavGroup('Employee Workspace', employeeLinks, () => setIsMobileOpen(false))}

            {/* Admin Management Links */}
            {isAdmin && renderNavGroup('Admin Management', adminLinks, () => setIsMobileOpen(false))}

            {/* Office Shift Timing Card */}
            <div className="pt-2 border-t border-[#DCD4C4] text-xs">
              <div className="bg-[#EAE4D6] border border-[#DCD4C4] rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C25E37]" />
                  <p className="font-extrabold text-[#1B3B34] text-[11px]">Office Shift Policy</p>
                </div>
                <p className="text-[11px] text-[#5A5347] leading-relaxed font-medium">
                  Standard: <span className="font-bold text-[#23201B]">09:30 AM – 06:30 PM</span>
                  <br />
                  Check-In Cutoff: <span className="text-[#C25E37] font-bold">09:45 AM</span>
                  <br />
                  Check-Out Cutoff: <span className="text-[#C25E37] font-bold">07:00 PM</span>
                </p>
              </div>
            </div>
          </div>

          {/* Drawer Footer with Sign Out Button */}
          <div className="p-3.5 border-t border-[#DCD4C4] bg-[#FAF6EE]">
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#EAE4D6] hover:bg-[#DCD4C4] active:bg-[#D4CCBA] text-[#AA4F2C] border border-[#DCD4C4] rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <LogOut className="w-4 h-4 stroke-[2.2]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
