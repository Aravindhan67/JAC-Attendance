import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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

      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please verify your credentials.');
      setLoading(false);
    }
  };

  // Show animated Logo Loading screen after successful login
  if (isSuccess) {
    return (
      <LogoLoading
        message={
          welcomeName
            ? `Welcome back, ${welcomeName}! Loading your workspace...`
            : 'Authentication verified. Preparing portal...'
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#EDE7DC] flex flex-col items-center justify-center p-4 selection:bg-[#C25E37] selection:text-[#FAF6EE]">
      
      {/* Handcrafted Studio Card */}
      <div className="max-w-md w-full bg-[#FAF6EE] rounded-2xl shadow-[0_4px_24px_rgba(35,32,27,0.06),0_1px_3px_rgba(35,32,27,0.04)] p-8 sm:p-10 border border-[#DCD4C4] transition-all">
        
        {/* Top Brand Block */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FAF6EE] p-1.5 border border-[#DCD4C4] shadow-xs flex items-center justify-center mb-3.5 overflow-hidden">
            <img
              src="/logo.jpg"
              alt="JAC MediaLand Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <h1 className="text-2xl font-black text-[#1B3B34] tracking-tight">
            JAC MediaLand
          </h1>

          <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-0.5 rounded-full bg-[#E2ECE6] border border-[#BCD3C5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B3B34]" />
            <span className="text-[10px] text-[#1B3B34] font-extrabold tracking-widest uppercase">
              Staff & Attendance Portal
            </span>
          </div>

          <p className="text-xs text-[#5A5347] mt-2 font-medium">
            Sign in with your employee credentials or administrative key
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-[#FAF0ED] border border-[#EAC7BF] rounded-xl flex items-center gap-2.5 text-xs text-[#9C3F2B] font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C25E37]" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#23201B] mb-1.5">
              Employee ID or Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8A8274] absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. JAC-007 or name@jacmedia.com"
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]/20 focus:border-[#C25E37] transition-all font-medium text-[#23201B] placeholder:text-[#8A8274]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#23201B] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8A8274] absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-10 pr-11 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]/20 focus:border-[#C25E37] transition-all font-medium text-[#23201B] placeholder:text-[#8A8274]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-[#8A8274] hover:text-[#23201B] rounded-lg transition-colors"
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
            className="w-full mt-2 bg-[#C25E37] hover:bg-[#AA4F2C] disabled:opacity-50 text-[#FAF6EE] font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-150 tracking-wide uppercase active:scale-[0.99]"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* Security badge footer */}
        <div className="mt-8 pt-5 border-t border-[#DCD4C4]/60 flex items-center justify-center gap-2 text-[#8A8274] text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1B3B34]" />
          <span>Facial verification & shift policy enforced</span>
        </div>

      </div>

      <div className="mt-6 text-center text-[11px] text-[#8A8274]">
        JAC MediaLand • IT Hub & Workforce Operations
      </div>

    </div>
  );
}
