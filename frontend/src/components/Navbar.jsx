import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Clock, ShieldCheck, UserCircle, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-black p-1 shadow-sm border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300">
            <img
              src="/logo.jpg"
              alt="JAC MediaLand Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 tracking-tight text-sm sm:text-base">
                JAC MediaLand
              </span>
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase bg-slate-900 text-[#E6CA65] border border-[#D4AF37]/35 px-2 py-0.5 rounded-full shadow-xs">
                IT Hub
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">
              DREAM ZONE • Enterprise Workforce
            </p>
          </div>
        </div>

        {/* Right Section: Time & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Live digital clock */}
          <div className="hidden md:flex items-center gap-2.5 bg-white/90 border border-slate-200/90 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-600">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md shadow-xs border border-slate-200/60">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* User info badge */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline">{user.name}</span>
                  {isAdmin ? (
                    <span className="text-[10px] bg-slate-900 text-[#E6CA65] font-bold px-2.5 py-0.5 rounded-full border border-[#D4AF37]/35 flex items-center gap-1 shadow-xs">
                      <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                      Admin
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
                      {user.employeeId}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 hidden sm:block font-medium truncate max-w-[150px]">
                  {user.designation || user.department}
                </div>
              </div>

              {/* Avatar with luxury matte gold ring */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#B38728] via-[#D4AF37] to-[#C59B27] p-[1.5px] shadow-sm shrink-0">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-slate-800 font-bold text-xs overflow-hidden">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="bg-slate-900 w-full h-full flex items-center justify-center text-[#E6CA65] font-black">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign Out"
                className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-all duration-200"
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
