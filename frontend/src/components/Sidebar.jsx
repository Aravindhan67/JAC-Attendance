import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarOff,
  Users,
  ClipboardList,
  ShieldAlert,
  Camera,
  CheckSquare,
} from 'lucide-react';

export default function Sidebar() {
  const { isAdmin } = useAuth();

  const employeeLinks = [
    { to: '/', label: 'Clock In / Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/my-attendance', label: 'My Attendance', icon: CalendarCheck2 },
    { to: '/my-leaves', label: 'My Leaves', icon: CalendarOff },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard },
    { to: '/admin/tasks', label: 'Task Manager', icon: CheckSquare },
    { to: '/admin/attendance', label: 'Attendance & Photos', icon: Camera },
    { to: '/admin/leaves', label: 'Leave Approvals', icon: CalendarOff },
    { to: '/admin/employees', label: 'Manage Staff', icon: Users },
  ];

  const renderNavGroup = (title, links) => (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 px-3 mb-2">
        {title}
      </div>
      <nav className="space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-[#F2E394] border border-[#D4AF37]/40 shadow-sm scale-[1.01]'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
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
    <aside className="w-64 bg-white/70 backdrop-blur-md border-r border-amber-900/10 p-4 shrink-0 hidden md:block min-h-[calc(100vh-4rem)]">
      {/* Employee navigation */}
      {renderNavGroup('Employee Workspace', employeeLinks)}

      {/* Admin specific navigation */}
      {isAdmin && renderNavGroup('Admin Management', adminLinks)}

      {/* Quick helper box */}
      <div className="mt-auto pt-6 border-t border-amber-900/10 text-slate-500 text-xs p-2">
        <div className="bg-amber-50/40 border border-amber-200/50 rounded-2xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="font-extrabold text-slate-800 text-[11px]">Office Shift Timing</p>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Standard: <span className="font-bold text-slate-900">09:30 AM – 06:30 PM</span>
            <br />
            Check-In Cutoff: <span className="text-amber-800 font-bold">09:45 AM</span>
            <br />
            Check-Out Cutoff: <span className="text-amber-800 font-bold">07:00 PM</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

