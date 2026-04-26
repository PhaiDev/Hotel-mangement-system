'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Grid, List, DoorOpen, LineChart, LogOut, Menu, X, User, CalendarDays } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');



  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !pathname.includes('/login')) {
        router.push('/admin/login');
      } else {
        setUserEmail(user?.email || 'admin');
        setIsChecking(false);
      }
    };
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/admin/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [pathname, router, supabase]);

  // Update Page Title (Browser Tab)
  useEffect(() => {
    const title = "DashBoard";
    document.title = `Sumotel Admin | ${title}`;
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#c9440f] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] text-[#8a8780] font-mono">กำลังตรวจสอบสิทธิ์...</span>
        </div>
      </div>
    );
  }

  // Hide layout for login
  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: Grid },
    { name: 'รายการจอง', path: '/admin/bookings', icon: List },
    { name: 'จัดการห้อง', path: '/admin/rooms', icon: DoorOpen },
    { name: 'ปฏิทินห้องว่าง', path: '/admin/calendar', icon: CalendarDays },
    { name: 'วิเคราะห์ข้อมูล', path: '/admin/analysis', icon: LineChart },
    { name: 'Profile', path: '/admin/profile', icon: User },
  ];
  const getPageTitle = () => {
    const current = navItems.find(item => item.path === pathname);
    return current?.name || 'Dashboard';
  };


  // Dynamic page title based on pathname
  return (
    <div className="min-h-screen bg-[#f5f4f0] font-sans text-[#1a1916] flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-[220px] bg-[#1a1916] text-white flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10">
          <div className="font-mono text-[15px] font-medium tracking-[2px]">SUMOTEL</div>
          <div className="text-[10px] text-white/40 tracking-[1px] mt-1 uppercase">Admin Panel</div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-2.5 mx-0 text-[13px] transition-all border-l-4 ${isActive
                  ? 'border-[#c9440f] bg-[#c9440f]/10 text-white'
                  : 'border-transparent text-white/55 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-white/10 text-[11px] text-white/30 font-mono">
          <div className="mb-2 text-white/50 truncate">
            👤 <span>{userEmail}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-[#c9440f]/15 border border-[#c9440f]/30 text-[#f87060] rounded-md py-2 px-1 text-[11px] hover:bg-[#c9440f]/30 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <LogOut className="w-3 h-3" /> ออกจากระบบ
          </button>
          <div className="mt-3">v1.0.0 · admin</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[220px] min-w-0 flex flex-col min-h-screen">
        <div className="bg-white border-b border-[#e2e0d8] px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1 border border-[#d0cdc2] rounded text-[#1a1916]"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="text-[14px] font-semibold truncate">{getPageTitle()}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#1a7a4a] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a7a4a] animate-pulse"></span>
              LIVE
            </div>
            {/* <button
              onClick={() => window.dispatchEvent(new Event('open-booking-modal'))}
              className="px-3 py-1.5 rounded bg-white border border-[#d0cdc2] text-[12px] hover:bg-[#f5f4f0] transition-colors ml-2"
            >
              + จองห้อง
            </button> */}
          </div>
        </div>

        <div className="p-3 sm:p-6 lg:p-7 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
