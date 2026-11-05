import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarOff,
  Users,
  Camera,
  Clock,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

export default function BottomNav() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Employee Navigation (Camera in center navigating to Check-In / Dashboard)
  const employeeItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/', label: 'Check In', icon: Camera, isCenter: true, exact: true },
    { to: '/my-attendance', label: 'History', icon: CalendarCheck2 },
    { to: '/my-leaves', label: 'Leaves', icon: CalendarOff },
  ];

  // Admin Navigation (Clean 4-tab management dock without camera button)
  const adminItems = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/admin/leaves', label: 'Leaves', icon: CalendarOff },
    { to: '/admin/employees', label: 'Staff', icon: Users },
  ];

  const items = isAdmin ? adminItems : employeeItems;

  return (
    <div className="fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto md:hidden pointer-events-none">
      {/* Floating Pro Capsule Dock */}
      <nav className="pointer-events-auto relative bg-[#0B0D13]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] px-2.5 py-1.5 transition-all duration-300">
        
        {/* Subtle Matte Gold Accent Line */}
        <div className="absolute -top-[1px] inset-x-14 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

        <div className="flex items-center justify-between">
          {items.map((item) => {
            const Icon = item.icon;
            const isMatch = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            // If on '/', highlight the center Camera for employee
            const isActive = item.isCenter
              ? isMatch
              : item.to === '/' && !isAdmin
              ? false
              : isMatch;

            // Special Elevated Centerpiece Action (Camera)
            if (item.isCenter) {
              return (
                <NavLink
                  key={item.to + item.label}
                  to={item.to}
                  onClick={() => {
                    if (!isAdmin) {
                      window.dispatchEvent(new CustomEvent('open-punch-modal'));
                    }
                  }}
                  className="flex flex-col items-center -mt-5 relative group transition-transform active:scale-95 px-2"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-tr from-[#B38728] via-[#D4AF37] to-[#C59B27] text-slate-950 border border-[#F2E394]/40 shadow-lg shadow-black/60 scale-105'
                        : 'bg-zinc-900 text-amber-200/70 border border-white/10 shadow-md hover:scale-105'
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase tracking-wider mt-1 transition-colors ${
                      isActive ? 'text-[#E6CA65]' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-[#D4AF37] mt-0.5" />
                  )}
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                className="flex flex-col items-center justify-center flex-1 py-1 px-1 relative transition-all active:scale-90"
              >
                <div
                  className={`flex items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-[#E6CA65] border border-[#D4AF37]/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2]' : 'stroke-2'}`} />
                </div>

                <span
                  className={`text-[10px] tracking-tight mt-0.5 font-bold truncate max-w-[64px] transition-colors ${
                    isActive ? 'text-[#E6CA65]' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#D4AF37] mt-0.5" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

