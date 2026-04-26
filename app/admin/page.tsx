'use client';

import React, { useState, useEffect } from 'react';
import { backend, Room, Booking, BookingStatus } from '@/lib/supabase';
import { SwalStyled, swalCSS } from '@/lib/swalTheme';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Link from 'next/link';
import { RefreshCw, Eye } from 'lucide-react';
import useSWR from 'swr';

const MySwal = withReactContent(Swal);

export default function DashboardPage() {
  const { data: rooms = [], mutate: mutateRooms, isLoading: loadingRooms } = useSWR('rooms', backend.getRooms, { revalidateOnFocus: true });
  const { data: bookings = [], mutate: mutateBookings, isLoading: loadingBookings } = useSWR('bookings', backend.getBookings, { revalidateOnFocus: true });
  const loading = loadingRooms || loadingBookings;

  const fetchAllData = async () => {
    await Promise.all([mutateRooms(), mutateBookings()]);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = swalCSS;
    document.head.appendChild(style);

    // Listen for booking modal trigger from header button
    const handler = () => onCreateBooking();
    window.addEventListener('open-booking-modal', handler);
    return () => {
      if (document.head.contains(style)) document.head.removeChild(style);
      window.removeEventListener('open-booking-modal', handler);
    };
  }, []);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      const y = d.getFullYear() + 543;
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${day}/${m}/${y}`;
    } catch { return isoString; }
  };

  const statusBadge = (s: BookingStatus) => {
    const statusMap: Record<BookingStatus, React.ReactNode> = {
      'PENDING': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-[#fdf8e7] text-[#b58a00]">⏳ รอชำระ</span>,
      'PAID': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-[#eaf0fb] text-[#1a4fa0]">฿ ชำระแล้ว</span>,
      'ACTIVE': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-[#eaf5ef] text-[#1a7a4a]">🏠 เข้าพัก</span>,
      'COMPLETED': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-[#eaf5ef] text-[#1a7a4a]">✓ เช็คเอาท์</span>,
      'CANCELLED': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-[#fafaf8] text-[#8a8780]">✕ ยกเลิก</span>,
    };
    return statusMap[s] || <span>{s}</span>;
  };

  const getRoomName = (roomId: number) => rooms.find(r => r.id === roomId)?.name || `ID:${roomId}`;
  const isRoomOccupied = (roomId: number) => bookings.some(b => b.roomId === roomId && b.status === 'ACTIVE');

  // Dashboard Stats
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => isRoomOccupied(r.id)).length;
  const availableRooms = Math.max(0, totalRooms - occupiedRooms);
  const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
  const todayRevenue = bookings
    .filter(b => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

  // ===== CREATE BOOKING from Dashboard =====
  const onCreateBooking = async () => {
    // Wait for rooms to load if needed
    let availableRoomsList = rooms.filter(r => r.isActive);
    if (availableRoomsList.length === 0) {
      try {
        availableRoomsList = (await backend.getRooms()).filter(r => r.isActive);
      } catch { }
    }
    const roomOptions = availableRoomsList.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    const { value: formValues } = await SwalStyled.fire({
      title: '➕ สร้างการจองใหม่',
      html: `
        <div style="text-align:left;">
          <label class="swal-form-label">ชื่อผู้เข้าพัก *</label>
          <input id="swal-name" class="swal-form-input" placeholder="ชื่อ-นามสกุล">

          <label class="swal-form-label">LINE ID</label>
          <input id="swal-line" class="swal-form-input" placeholder="@line_id">

          <label class="swal-form-label">ห้องพัก *</label>
          <select id="swal-room" class="swal-form-select">
            <option value="">-- เลือกห้อง --</option>
            ${roomOptions}
          </select>

          <div class="swal-form-row">
            <div>
              <label class="swal-form-label">เช็คอิน *</label>
              <input id="swal-checkin" type="date" class="swal-form-input">
            </div>
            <div>
              <label class="swal-form-label">เช็คเอาท์ *</label>
              <input id="swal-checkout" type="date" class="swal-form-input">
            </div>
          </div>

          <label class="swal-form-label">ยอดเงิน (฿)</label>
          <input id="swal-price" type="number" class="swal-form-input" placeholder="0">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '✨ สร้างการจอง',
      cancelButtonText: 'ยกเลิก',
      width: 520,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        const room = (document.getElementById('swal-room') as HTMLSelectElement).value;
        const checkIn = (document.getElementById('swal-checkin') as HTMLInputElement).value;
        const checkOut = (document.getElementById('swal-checkout') as HTMLInputElement).value;
        if (!name.trim()) { Swal.showValidationMessage('กรุณากรอกชื่อผู้เข้าพัก'); return false; }
        if (!room) { Swal.showValidationMessage('กรุณาเลือกห้องพัก'); return false; }
        if (!checkIn || !checkOut) { Swal.showValidationMessage('กรุณาเลือกวันเช็คอิน/เช็คเอาท์'); return false; }
        return {
          customerName: name,
          customerLine: (document.getElementById('swal-line') as HTMLInputElement).value,
          roomId: Number(room),
          checkIn,
          checkOut,
          totalPrice: Number((document.getElementById('swal-price') as HTMLInputElement).value) || 0,
        };
      },
    });

    if (formValues) {
      try {
        await backend.createBooking(formValues);
        SwalStyled.fire({ icon: 'success', title: 'สร้างสำเร็จ!', text: 'เพิ่มการจองใหม่เรียบร้อยแล้ว', timer: 1800, showConfirmButton: false });
        fetchAllData();
      } catch (err: any) {
        SwalStyled.fire('ล้มเหลว', err.message, 'error');
      }
    }
  };

  // ===== VIEW DETAIL from Dashboard =====
  const onViewDetail = (b: Booking) => {
    const room = rooms.find(r => r.id === b.roomId);
    const pinCode = room ? room.pinLock : null;
    SwalStyled.fire({
      title: '📋 รายละเอียดการจอง',
      html: `
        <div class="text-left font-sans mt-2">
          <div class="mb-4">
            <div class="text-[10px] sm:text-[11px] font-bold text-[#8a8780] uppercase tracking-widest mb-2 flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ข้อมูลผู้เข้าพัก</div>
            <div class="border border-[#e2e0d8] rounded-xl overflow-hidden bg-white">
              <div class="px-4 py-3 border-b border-[#e2e0d8]">
                <div class="text-[10px] text-[#8a8780] mb-0.5">ชื่อ-นามสกุล / Name</div>
                <div class="font-bold text-[14px] text-[#1a1916]">${b.customerName || '—'}</div>
              </div>
              <div class="px-4 py-3">
                <div class="text-[10px] text-[#8a8780] mb-0.5">เบอร์โทร / LINE ID</div>
                <div class="font-bold font-mono text-[13px] text-[#1a1916]">${b.customerLine || '—'}</div>
              </div>
            </div>
          </div>

          <div class="mb-5">
            <div class="text-[10px] sm:text-[11px] font-bold text-[#8a8780] uppercase tracking-widest mb-2 flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg> รายละเอียดการเข้าพัก</div>
            <div class="grid grid-cols-2 gap-3">
              <div class="border border-[#e2e0d8] rounded-xl px-4 py-3 bg-white">
                <div class="text-[10px] text-[#8a8780] mb-0.5">ห้องพัก / Room</div>
                <div class="font-bold text-[16px] text-[#1a1916] leading-tight mt-1">${getRoomName(b.roomId)}</div>
              </div>
              <div class="border border-[#e2e0d8] rounded-xl px-4 py-3 bg-white">
                <div class="text-[10px] text-[#8a8780] mb-0.5">วันที่ / Dates</div>
                <div class="font-bold font-mono text-[13px] text-[#1a1916] mt-0.5">${formatDate(b.checkIn)}</div>
                <div class="text-[10px] text-[#8a8780] mt-0.5">ถึง ${formatDate(b.checkOut)}</div>
              </div>
            </div>
          </div>

          <div class="mb-5 grid grid-cols-2 gap-3">
             <div class="border border-[#e2e0d8] rounded-xl px-4 py-2 bg-white flex flex-col justify-center">
                <div class="text-[10px] text-[#8a8780] mb-0.5">สถานะ / Status</div>
                <div class="font-bold text-[12px] text-[#1a1916]">${b.status}</div>
             </div>
             <div class="border border-[#e2e0d8] rounded-xl px-4 py-2 bg-white flex flex-col justify-center">
                <div class="text-[10px] text-[#8a8780] mb-0.5">รหัส PIN</div>
                <div class="font-bold font-mono text-[13px] text-[#1a1916]">${pinCode || '—'}</div>
             </div>
          </div>

          <div class="bg-[#1a1916] rounded-xl p-5 flex items-center justify-between text-white shadow-md">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              <span class="text-[13px] font-medium text-white/80">ยอดสุทธิ (Total)</span>
            </div>
            <div class="font-mono text-[26px] font-bold text-[#e88c2a]">฿${Number(b.totalPrice || 0).toLocaleString()}</div>
          </div>
        </div>
      `,
      confirmButtonText: 'ปิด',
      width: 440,
    });
  };

  if (loading && rooms.length === 0) return (
    <div className="py-20 flex justify-center text-[#8a8780]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#c9440f] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] font-mono">กำลังโหลดแดชบอร์ด...</span>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Dashboard Summary</h1>
        <button onClick={fetchAllData} className="p-1.5 rounded-md border border-[#d0cdc2] text-[#8a8780] hover:bg-[#f5f4f0] transition-colors" title="รีเฟรช">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <div className="bg-white border border-[#e2e0d8] rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[10px] sm:text-[11px] font-bold text-[#8a8780] uppercase tracking-widest mb-3">ว่างวันนี้</div>
          <div className="font-mono text-[32px] sm:text-[36px] font-bold leading-none mb-2 text-[#1a7a4a]">{availableRooms}</div>
          <div className="text-[11px] sm:text-[12px] text-[#8a8780] font-medium">จากทั้งหมด {totalRooms} ห้อง</div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[10px] sm:text-[11px] font-bold text-[#8a8780] uppercase tracking-widest mb-3">มีผู้เข้าพักอยู่</div>
          <div className="font-mono text-[32px] sm:text-[36px] font-bold leading-none mb-2 text-[#c9440f]">{occupiedRooms}</div>
          <div className="text-[11px] sm:text-[12px] text-[#8a8780] font-medium">ห้อง</div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[10px] sm:text-[11px] font-bold text-[#8a8780] uppercase tracking-widest mb-3">รอชำระเงิน</div>
          <div className="font-mono text-[32px] sm:text-[36px] font-bold leading-none mb-2 text-[#b58a00]">{pendingBookings}</div>
          <div className="text-[11px] sm:text-[12px] text-[#8a8780] font-medium">รายการจอง</div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[10px] sm:text-[11px] font-bold text-[#8a8780] uppercase tracking-widest mb-3">รายได้รวม</div>
          <div className="font-mono text-[24px] sm:text-[28px] font-bold leading-none mb-2 text-[#1a4fa0]">฿{todayRevenue.toLocaleString()}</div>
          <div className="text-[11px] sm:text-[12px] text-[#8a8780] font-medium">จาก {bookings.filter(b => b.status !== 'CANCELLED').length} รายการ</div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-[#e2e0d8] rounded-2xl mb-6 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[#e2e0d8] flex items-center justify-between">
          <div className="text-[15px] font-bold tracking-tight text-[#1a1916]">รายการจองล่าสุด</div>
          <Link href="/admin/bookings" className="text-[12px] text-[#c9440f] font-bold hover:bg-[#c9440f]/10 px-3 py-1.5 rounded-lg transition-colors">ดูทั้งหมด →</Link>
        </div>

        <div className="flex flex-col divide-y divide-[#f0f0f0]">
          {bookings.slice(0, 5).map((b) => (
            <div key={b.id} className="p-4 hover:bg-[#fafafa] transition-colors flex flex-col sm:flex-row sm:items-center gap-3 justify-between group cursor-pointer" onClick={() => onViewDetail(b)}>

              {/* Left: Guest & Room */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a1916] text-[#c9440f] flex items-center justify-center font-bold text-[14px] shrink-0">
                  {getRoomName(b.roomId).replace(/\D/g, '') || 'R'}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] text-[#1a1916]">{b.customerName || 'ไม่ระบุชื่อ'}</span>
                  <span className="text-[11px] text-[#8a8780] font-medium">{getRoomName(b.roomId)} • เช็คอิน {formatDate(b.checkIn)}</span>
                </div>
              </div>

              {/* Right: Status & Price */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-auto w-full pl-12 sm:pl-0 mt-1 sm:mt-0">
                <div className="font-mono font-bold text-[#1a4fa0] text-[14px]">฿{Number(b.totalPrice || 0).toLocaleString()}</div>
                <div>{statusBadge(b.status)}</div>
                <button className="hidden sm:flex p-2 rounded-lg hover:bg-[#eaf0fb] text-[#1a4fa0] opacity-0 group-hover:opacity-100 transition-all">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="text-center py-12 text-[#8a8780] bg-[#fafaf8]">
              <div className="text-[40px] mb-3 opacity-20">📭</div>
              <div className="text-[13px] font-medium">ไม่มีข้อมูลการจองล่าสุด</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Room Overview */}
      <div className="bg-white border border-[#e2e0d8] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[#e2e0d8] flex items-center justify-between">
          <div className="text-[15px] font-bold tracking-tight text-[#1a1916]">สถานะห้องพัก</div>
          <Link href="/admin/rooms" className="text-[12px] text-[#c9440f] font-bold hover:bg-[#c9440f]/10 px-3 py-1.5 rounded-lg transition-colors">จัดการ →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 p-4 sm:p-5 bg-[#fcfbf9]">
          {rooms.map(r => {
            const occupiedBooking = bookings.find(b => b.roomId === r.id && b.status === 'ACTIVE');
            const occupied = !!occupiedBooking;
            return (
              <div key={r.id} className={`rounded-lg p-2 text-center border transition-all flex flex-col justify-center min-h-[64px] ${occupied
                ? 'bg-[#c9440f]/5 border-[#c9440f]/20 text-[#c9440f]'
                : r.isActive
                  ? 'bg-[#eaf5ef] border-[#1a7a4a]/20 text-[#1a7a4a]'
                  : 'bg-[#fafaf8] border-[#e2e0d8] text-[#8a8780]'
                }`}>
                <div className="font-mono text-[13px] font-bold">{r.name}</div>
                <div className="text-[9px] mt-0.5 font-medium truncate">
                  {occupied
                    ? (
                      <div className="flex flex-col leading-tight">
                        <span className="truncate">{occupiedBooking.customerName}</span>
                        {occupiedBooking.customerLine && <span className="opacity-70 truncate text-[8px]">{occupiedBooking.customerLine}</span>}
                      </div>
                    )
                    : r.isActive ? 'ว่าง' : 'ระงับ'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
