'use client';

import React, { useState, useEffect } from 'react';
import { backend, Room, Booking, BookingStatus } from '@/lib/supabase';
import { SwalStyled, swalCSS } from '@/lib/swalTheme';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Link from 'next/link';
import { RefreshCw, Eye } from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [fetchedRooms, fetchedBookings] = await Promise.all([
        backend.getRooms(),
        backend.getBookings(),
      ]);
      setRooms(fetchedRooms || []);
      setBookings(fetchedBookings || []);
    } catch (err: any) {
      console.error(err);
      SwalStyled.fire('โหลดข้อมูลล้มเหลว', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const style = document.createElement('style');
    style.textContent = swalCSS;
    document.head.appendChild(style);

    // Listen for booking modal trigger from header button
    const handler = () => onCreateBooking();
    window.addEventListener('open-booking-modal', handler);
    return () => {
      document.head.removeChild(style);
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
    SwalStyled.fire({
      title: '📋 รายละเอียดการจอง',
      html: `
        <div style="text-align:left; font-size:13px; line-height:2.2;">
          <div style="display:grid; grid-template-columns: 120px 1fr; gap: 4px 12px;">
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">ผู้เข้าพัก</span>
            <span style="font-weight:500;">${b.customerName || '—'}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">ห้องพัก</span>
            <span>${getRoomName(b.roomId)}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">เช็คอิน</span>
            <span style="font-family:monospace;">${formatDate(b.checkIn)}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">เช็คเอาท์</span>
            <span style="font-family:monospace;">${formatDate(b.checkOut)}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">ยอดเงิน</span>
            <span style="font-family:monospace; color:#c9440f; font-weight:600;">฿${Number(b.totalPrice || 0).toLocaleString()}</span>
          </div>
        </div>
      `,
      confirmButtonText: 'ปิด',
      width: 440,
    });
  };

  if (loading) return (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px] mb-2.5">ว่างวันนี้</div>
          <div className="font-mono text-[28px] font-medium leading-none mb-1.5 text-[#1a7a4a]">{availableRooms}</div>
          <div className="text-[11px] text-[#8a8780]">จากทั้งหมด {totalRooms} ห้อง</div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px] mb-2.5">มีผู้เข้าพักอยู่</div>
          <div className="font-mono text-[28px] font-medium leading-none mb-1.5 text-[#c9440f]">{occupiedRooms}</div>
          <div className="text-[11px] text-[#8a8780]">ห้อง</div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px] mb-2.5">รอชำระเงิน</div>
          <div className="font-mono text-[28px] font-medium leading-none mb-1.5 text-[#b58a00]">{pendingBookings}</div>
          <div className="text-[11px] text-[#8a8780]">รายการ</div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px] mb-2.5">รายได้รวม</div>
          <div className="font-mono text-[24px] font-medium leading-none mb-1.5 text-[#1a4fa0]">฿{todayRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-[#8a8780]">จาก {bookings.filter(b => b.status !== 'CANCELLED').length} รายการ</div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-[#e2e0d8] rounded-lg mb-5 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[#e2e0d8] flex items-center justify-between">
          <div className="text-[13px] font-semibold tracking-[0.3px]">รายการจองล่าสุด</div>
          <Link href="/admin/bookings" className="text-[12px] text-[#c9440f] font-medium hover:underline">ดูทั้งหมด →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr className="bg-[#fafaf8]">
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]">ผู้เข้าพัก</th>
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]">ห้อง</th>
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]">เช็คอิน</th>
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]">ยอด</th>
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]">สถานะ</th>
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map((b) => (
                <tr key={b.id} className="hover:bg-[#fafaf8] group transition-colors">
                  <td className="py-3 px-4 border-b border-[#e2e0d8] font-medium">{b.customerName}</td>
                  <td className="py-3 px-4 border-b border-[#e2e0d8] text-[#8a8780]">{getRoomName(b.roomId)}</td>
                  <td className="py-3 px-4 border-b border-[#e2e0d8] font-mono text-[12px]">{formatDate(b.checkIn)}</td>
                  <td className="py-3 px-4 border-b border-[#e2e0d8] font-mono">฿{Number(b.totalPrice || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 border-b border-[#e2e0d8]">{statusBadge(b.status)}</td>
                  <td className="py-3 px-4 border-b border-[#e2e0d8]">
                    <button onClick={() => onViewDetail(b)} className="p-1.5 rounded-md hover:bg-[#eaf0fb] text-[#1a4fa0] opacity-0 group-hover:opacity-100 transition-all" title="ดูรายละเอียด">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-[#8a8780]">
                  <div className="text-[28px] mb-2">📭</div>
                  <div className="text-[13px]">ไม่มีข้อมูลล่าสุด</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Room Overview */}
      <div className="bg-white border border-[#e2e0d8] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[#e2e0d8] flex items-center justify-between">
          <div className="text-[13px] font-semibold tracking-[0.3px]">สถานะห้องพัก</div>
          <Link href="/admin/rooms" className="text-[12px] text-[#c9440f] font-medium hover:underline">จัดการ →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 p-4">
          {rooms.map(r => {
            const occupied = isRoomOccupied(r.id);
            return (
              <div key={r.id} className={`rounded-lg p-3 text-center border transition-colors ${occupied
                  ? 'bg-[#c9440f]/5 border-[#c9440f]/20 text-[#c9440f]'
                  : r.isActive
                    ? 'bg-[#eaf5ef] border-[#1a7a4a]/20 text-[#1a7a4a]'
                    : 'bg-[#fafaf8] border-[#e2e0d8] text-[#8a8780]'
                }`}>
                <div className="font-mono text-[14px] font-medium">{r.name}</div>
                <div className="text-[10px] mt-0.5 opacity-70">
                  {occupied ? 'มีผู้พัก' : r.isActive ? 'ว่าง' : 'ระงับ'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
