import React from 'react';
import { Sparkles } from 'lucide-react';

export default function LogoLoading({ message = 'Accessing Workspace...' }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#070709] flex items-center justify-center p-4 overflow-hidden select-none">
      
      {/* Ambient Matte Gold Subtle Orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-[#B38728]/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#D4AF37]/8 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Subtle Digital Grid Matrix Texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(212, 175, 55, 0.25) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Luxury Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full animate-float-slow">
        
        {/* Orbital Ring + Logo Centerpiece */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          
          {/* Outer Orbital Ring 1 (Clockwise) - Matte Brushed Gold */}
          <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20 animate-cosmic-orbit">
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38728] shadow-sm" />
          </div>

          {/* Inner Orbital Ring 2 (Counter-Clockwise) - Champagne Gold */}
          <div className="absolute inset-2 sm:inset-3 rounded-full border border-[#F2E394]/15 animate-reverse-orbit">
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#E6CA65] shadow-xs" />
          </div>

          {/* Subtle Warm Aura Behind Card */}
          <div className="absolute inset-4 rounded-3xl bg-gradient-to-tr from-[#B38728] to-[#D4AF37] opacity-15 blur-xl" />

          {/* Center Glassmorphic Logo Plaque - Stark Black with Subtle Brass Rim */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-black p-3 flex items-center justify-center border border-[#D4AF37]/35 shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden">
            <img
              src="/logo.jpg"
              alt="JAC MediaLand"
              className="w-full h-full object-contain rounded-xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            />
            {/* Shimmer laser beam overlay */}
            <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-laser-shimmer" />
          </div>

        </div>

        {/* Brand Headline with Refined Metallic Gold Text */}
        <div className="mt-8 space-y-2.5">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#F2E394] uppercase drop-shadow-md">
              JAC MEDIALAND
            </h1>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-[#D4AF37]/25 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#E6CA65] animate-spin [animation-duration:5s]" />
            <span className="text-[10px] font-extrabold tracking-widest text-[#E6CA65] uppercase">
              DREAM ZONE • IT PORTAL
            </span>
          </div>

          {/* Progress Bar - Understated Matte Gold */}
          <div className="w-52 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-[#F2E394] rounded-full animate-laser-shimmer opacity-80" />
          </div>

          {/* Status Text & Status Indicator */}
          <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-2 pt-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] opacity-90" />
            <span>{message}</span>
          </p>
        </div>

      </div>

      {/* Bottom Legal Brand Tag */}
      <div className="absolute bottom-6 text-[10px] text-amber-500/40 font-mono tracking-widest uppercase">
        Enterprise Workspace • Secured by JAC Cloud
      </div>

    </div>
  );
}
