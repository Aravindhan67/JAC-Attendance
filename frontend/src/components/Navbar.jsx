import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Clock, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#FAF6EE] border-b border-[#DCD4C4] shadow-[0_1px_4px_rgba(35,32,27,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] p-1 shadow-xs border border-[#DCD4C4] flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/logo.jpg"
              alt="JAC MediaLand Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-[#1B3B34] tracking-tight text-sm sm:text-base">
                JAC MediaLand
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase bg-[#E2ECE6] text-[#1B3B34] border border-[#BCD3C5] px-2 py-0.5 rounded-full">
                IT Hub
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#5A5347] font-medium hidden sm:block">
              Workforce Operations & Shift Registry
            </p>
          </div>
        </div>

        {/* Right Section: Time & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Live Clock Badge */}
          <div className="hidden md:flex items-center gap-2.5 bg-[#EAE4D6] border border-[#DCD4C4] px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#23201B]">
            <span className="w-2 h-2 rounded-full bg-[#1B3B34]" />
            <span className="font-semibold text-[#5A5347]">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="font-mono text-[#1B3B34] font-extrabold bg-[#FAF6EE] px-2 py-0.5 rounded-md border border-[#DCD4C4]">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* User info badge */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-[#DCD4C4]">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs font-bold text-[#23201B] hidden sm:inline">{user.name}</span>
                  {isAdmin ? (
                    <span className="text-[10px] bg-[#1B3B34] text-[#FAF6EE] font-extrabold px-2 py-0.5 rounded-full border border-[#142E28] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#E2ECE6]" />
                      Admin
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#EAE4D6] text-[#23201B] font-bold px-2 py-0.5 rounded-full border border-[#DCD4C4]">
                      {user.employeeId}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#5A5347] hidden sm:block font-medium truncate max-w-[150px]">
                  {user.designation || user.department}
                </div>
              </div>

              {/* Avatar with handcrafted terracotta ring */}
              <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border-2 border-[#C25E37] p-0.5 shadow-xs shrink-0 flex items-center justify-center">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="bg-[#1B3B34] w-full h-full rounded-full flex items-center justify-center text-[#FAF6EE] font-black text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign Out"
                className="text-[#8A8274] hover:text-[#C25E37] p-2 rounded-xl hover:bg-[#F6E7DF] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
