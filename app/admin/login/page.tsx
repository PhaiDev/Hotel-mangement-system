'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-[#f0ece8] font-sans flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse,rgba(201,68,15,0.12)_0%,transparent_70%)] pointer-events-none" />
      <div className="fixed -bottom-[20%] -right-[10%] w-[500px] h-[400px] bg-[radial-gradient(ellipse,rgba(74,55,40,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-[380px] bg-[#1a1714] border border-white/5 rounded-2xl p-10 relative z-10 mx-4">
        {/* Brand */}
        <div className="text-center mb-9">
          <div className="w-12 h-12 bg-[#c9440f] rounded-xl inline-flex items-center justify-center font-mono text-[20px] font-medium text-white mb-4 tracking-tighter">
            SU
          </div>
          <div className="font-mono text-[14px] font-medium tracking-[3px] text-[#f0ece8]">SUMOTEL</div>
          <div className="text-[11px] text-[#f0ece8]/40 mt-1 tracking-[1px] uppercase">Admin Portal</div>
        </div>

        {/* Error Box */}
        {error && (
          <div className="bg-[#c9440f]/10 border border-[#c9440f]/30 rounded-lg py-2.5 px-3.5 text-[12px] text-[#f87060] mb-4 text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} autoComplete="off">
          <div className="mb-4">
            <label className="block text-[11px] text-[#f0ece8]/40 uppercase tracking-[0.8px] mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3.5 text-[13px] text-[#f0ece8] outline-none transition-colors focus:border-white/15 focus:bg-white/10"
              placeholder="admin@sumotel.com"
            />
          </div>

          <div className="mb-4 relative">
            <label className="block text-[11px] text-[#f0ece8]/40 uppercase tracking-[0.8px] mb-2">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 pl-3.5 pr-10 text-[13px] text-[#f0ece8] outline-none transition-colors focus:border-white/15 focus:bg-white/10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-[#f0ece8]/40 hover:text-[#f0ece8] text-[14px]"
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9440f] text-white border-none rounded-lg py-3 text-[13px] font-semibold tracking-[0.5px] mt-2 transition-all hover:bg-[#e04d12] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังตรวจสอบ...
              </>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </form>

        <div className="mt-7 pt-5 border-t border-white/5 text-center">
          <span className="font-mono text-[10px] text-[#f0ece8]/40 tracking-[1px]">SUMOTEL ADMIN · v1.0</span>
        </div>
      </div>
    </div>
  );
}
