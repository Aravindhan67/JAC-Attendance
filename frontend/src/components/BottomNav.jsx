import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarOff,
  Users,
  Camera,
  CheckSquare,
  User,
} from 'lucide-react';

export default function BottomNav() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Employee Navigation (Camera in center navigating to Check-In / Dashboard)
  const employeeItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/my-attendance', label: 'History', icon: CalendarCheck2 },
    { to: '/', label: 'Check In', icon: Camera, isCenter: true, exact: true },
    { to: '/my-leaves', label: 'Leaves', icon: CalendarOff },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  // Admin Navigation (Clean 5-tab management dock)
  const adminItems = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/admin/leaves', label: 'Leaves', icon: CalendarOff },
    { to: '/admin/employees', label: 'Staff', icon: Users },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const items = isAdmin ? adminItems : employeeItems;

  return (
    <div className="fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto md:hidden pointer-events-none">
      {/* Floating Bespoke Capsule Dock */}
      <nav className="pointer-events-auto relative bg-[#FAF6EE] border border-[#DCD4C4] rounded-2xl shadow-[0_8px_25px_rgba(35,32,27,0.12)] px-2.5 py-1.5 transition-all">
        <div className="flex items-center justify-between">
          {items.map((item) => {
            const Icon = item.icon;
            const isMatch = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const isActive = item.isCenter
              ? isMatch
              : item.to === '/' && !isAdmin
              ? false
              : isMatch;

            // Center Action (Punch Camera)
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
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md ${
                      isActive
                        ? 'bg-[#C25E37] text-[#FAF6EE] border-2 border-[#FAF6EE] scale-105'
                        : 'bg-[#1B3B34] text-[#FAF6EE] border-2 border-[#FAF6EE] hover:scale-105'
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase tracking-wider mt-1 transition-colors ${
                      isActive ? 'text-[#C25E37]' : 'text-[#5A5347]'
                    }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                className="flex flex-col items-center justify-center flex-1 py-1 px-1 relative transition-all active:scale-95"
              >
                <div
                  className={`flex items-center justify-center px-3 py-1.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-[#E2ECE6] text-[#1B3B34] font-extrabold'
                      : 'text-[#5A5347] hover:text-[#23201B]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2]' : 'stroke-2'}`} />
                </div>

                <span
                  className={`text-[10px] tracking-tight mt-0.5 font-bold truncate max-w-[64px] transition-colors ${
                    isActive ? 'text-[#1B3B34]' : 'text-[#8A8274]'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
