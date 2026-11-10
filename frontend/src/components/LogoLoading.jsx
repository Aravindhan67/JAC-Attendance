import React from 'react';

export default function LogoLoading({ message = 'Accessing Workspace...' }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#EDE7DC] flex items-center justify-center p-4 select-none">
      
      {/* Handcrafted Warm Loading Plaque */}
      <div className="bg-[#FAF6EE] rounded-2xl border border-[#DCD4C4] p-8 max-w-xs w-full shadow-[0_8px_30px_rgba(35,32,27,0.08)] flex flex-col items-center text-center">
        
        {/* Brand Logo with Gentle Breathing Frame */}
        <div className="relative w-20 h-20 rounded-2xl bg-[#F3EDE3] p-2 border border-[#DCD4C4] shadow-xs flex items-center justify-center mb-5">
          <img
            src="/logo.jpg"
            alt="JAC MediaLand"
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        {/* Title */}
        <h2 className="text-base font-black tracking-tight text-[#1B3B34] uppercase">
          JAC MediaLand
        </h2>
        
        <p className="text-xs text-[#5A5347] font-medium mt-1 mb-5">
          {message}
        </p>

        {/* Terracotta Minimal Smooth Progress Bar */}
        <div className="w-full bg-[#EAE4D6] h-1.5 rounded-full overflow-hidden border border-[#DCD4C4]">
          <div className="bg-[#C25E37] h-full rounded-full animate-pulse w-3/4" />
        </div>

      </div>
    </div>
  );
}
