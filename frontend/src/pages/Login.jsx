import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import LogoLoading from '../components/LogoLoading';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(identifier, password);
      setWelcomeName(data.user?.name || '');
      setIsSuccess(true);

      // Display animated logo loading for 2.2 seconds before navigating to dashboard
      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 2200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  // Show animated Logo Loading screen after successful login
  if (isSuccess) {
    return (
      <LogoLoading
        message={
          welcomeName
            ? `Welcome back, ${welcomeName}! Preparing your workspace...`
            : 'Authentication successful! Loading workspace...'
        }
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070709] flex items-center justify-center p-4 overflow-hidden select-none">
      
      {/* Ambient Premium Gold Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full filter blur-[120px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-yellow-600/15 rounded-full filter blur-[140px] animate-pulse-glow [animation-delay:2s] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-700/10 rounded-full filter blur-[160px] pointer-events-none" />

      {/* Subtle Digital Grid Matrix Texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(245, 158, 11, 0.3) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Luxury Form Card - Dark Obsidian with Polished Gold Accents */}
      <div className="relative z-10 max-w-md w-full bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-8 sm:p-9 border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300">
        
        {/* Top Header */}
        <div className="text-center mb-7">
          <div className="relative inline-block mb-3 group">
            {/* Ambient gold logo glow */}
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 opacity-40 blur-md group-hover:opacity-75 transition duration-500" />
            <div className="relative w-20 h-20 mx-auto rounded-2xl bg-black p-2 shadow-2xl border-2 border-amber-400/50 flex items-center justify-center overflow-hidden">
              <img
                src="/logo.jpg"
                alt="JAC MediaLand Logo"
                className="w-full h-full object-contain transform group-hover:scale-105 transition duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
              />
            </div>
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300 tracking-tight">
            JAC MediaLand
          </h2>
          <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
            <p className="text-[11px] text-amber-300 font-extrabold tracking-wider uppercase">
              DREAM ZONE • IT PORTAL
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-950/50 border border-rose-500/40 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-amber-100/90 mb-1.5">
              Email or Employee ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-amber-400/60 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. JAC-007 or rahul@jacmedia.com"
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl focus:bg-black focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all font-medium text-amber-50 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-100/90 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-400/60 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-10 pr-11 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl focus:bg-black focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all font-medium text-amber-50 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-amber-400/60 hover:text-amber-300 rounded-lg hover:bg-white/5 transition-colors"
                title={showPassword ? 'Hide password' : 'View password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-[#B38728] via-[#D4AF37] to-[#C59B27] hover:from-[#A2771E] hover:to-[#B38728] disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 tracking-wide uppercase"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
          </button>
        </form>

        {/* Security watermark */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-amber-400/50 font-medium">
            Protected by JAC Multi-Tenant Biometric & Cloud Architecture
          </p>
        </div>

      </div>
    </div>
  );
}
