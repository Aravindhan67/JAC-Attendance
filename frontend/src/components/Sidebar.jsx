import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarOff,
  Users,
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
  );
}
