'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, User, Mail, Shield, Key, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [lastSignIn, setLastSignIn] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        setUserId(user.id);
        setLastSignIn(
          user.last_sign_in_at
            ? new Date(user.last_sign_in_at).toLocaleString('th-TH', {
                dateStyle: 'long',
                timeStyle: 'short',
              })
            : '—'
        );
      }
      setLoading(false);
    };
    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const handleChangePassword = async () => {
    const { value: newPassword } = await MySwal.fire({
      title: 'เปลี่ยนรหัสผ่าน',
      input: 'password',
      inputPlaceholder: 'รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#c9440f',
      inputValidator: (value) => {
        if (!value || value.length < 6) {
          return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        }
        return null;
      },
    });

    if (newPassword) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        MySwal.fire('ล้มเหลว', error.message, 'error');
      } else {
        MySwal.fire('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
      }
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center text-[#8a8780]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#c9440f] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-mono">กำลังโหลดโปรไฟล์...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-2xl">
      <div className="bg-white border border-[#e2e0d8] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1916] to-[#2a2520] p-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#c9440f] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#c9440f]/20">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{userEmail}</h1>
            <p className="text-sm text-white/50">Administrator</p>
          </div>
        </div>
        
        {/* Info Cards */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 border border-[#e2e0d8] rounded-lg bg-[#fafaf8] hover:border-[#d0cdc2] transition-colors">
              <div className="w-10 h-10 bg-[#eaf0fb] rounded-lg flex items-center justify-center">
                <Mail className="text-[#1a4fa0]" size={18} />
              </div>
              <div>
                <p className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px]">Email</p>
                <p className="text-[13px] font-medium mt-0.5">{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-[#e2e0d8] rounded-lg bg-[#fafaf8] hover:border-[#d0cdc2] transition-colors">
              <div className="w-10 h-10 bg-[#eaf5ef] rounded-lg flex items-center justify-center">
                <Shield className="text-[#1a7a4a]" size={18} />
              </div>
              <div>
                <p className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px]">Role</p>
                <p className="text-[13px] font-medium mt-0.5">Super Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-[#e2e0d8] rounded-lg bg-[#fafaf8] hover:border-[#d0cdc2] transition-colors">
              <div className="w-10 h-10 bg-[#fdf8e7] rounded-lg flex items-center justify-center">
                <Clock className="text-[#b58a00]" size={18} />
              </div>
              <div>
                <p className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px]">เข้าสู่ระบบล่าสุด</p>
                <p className="text-[13px] font-medium mt-0.5">{lastSignIn}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-[#e2e0d8] rounded-lg bg-[#fafaf8] hover:border-[#d0cdc2] transition-colors">
              <div className="w-10 h-10 bg-[#f5f0fb] rounded-lg flex items-center justify-center">
                <Key className="text-[#7c3aed]" size={18} />
              </div>
              <div>
                <p className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px]">User ID</p>
                <p className="text-[11px] font-mono mt-0.5 text-[#8a8780] truncate max-w-[180px]">{userId}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-[#e2e0d8] flex flex-wrap gap-3">
            <button 
              onClick={handleChangePassword}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#d0cdc2] text-[#1a1916] rounded-lg hover:bg-[#f5f4f0] transition-colors text-[13px] font-medium"
            >
              <Key size={15} /> เปลี่ยนรหัสผ่าน
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#f87060]/30 text-[#f87060] rounded-lg hover:bg-rose-50 transition-colors text-[13px] font-medium"
            >
              <LogOut size={15} /> ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
