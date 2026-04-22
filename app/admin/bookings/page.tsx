'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { backend, Room, Booking, BookingStatus } from '@/lib/supabase';
import { SwalStyled, swalCSS } from '@/lib/swalTheme';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Pencil, Trash2, Eye, RefreshCw, Plus, Search } from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function BookingsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedRooms, fetchedBookings] = await Promise.all([
        backend.getRooms(),
        backend.getBookings(),
      ]);
      setRooms(fetchedRooms || []);
      setBookings(fetchedBookings || []);
    } catch (err: any) {
      SwalStyled.fire('โหลดข้อมูลล้มเหลว', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Inject swal CSS
    const style = document.createElement('style');
    style.textContent = swalCSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      const y = d.getFullYear() + 543;
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${day}/${m}/${y}`;
    } catch { return isoString; }
  };

  const formatShortDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    } catch { return isoString; }
  };

  const toInputDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toISOString().split('T')[0];
    } catch { return ''; }
  };

  const statusBadge = (s: BookingStatus) => {
    const statusMap: Record<BookingStatus, React.ReactNode> = {
      'PENDING': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-[#fdf8e7] text-[#b58a00] border border-[#fdf3d0]">⏳ รอชำระ</span>,
      'PAID': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-[#eaf0fb] text-[#1a4fa0] border border-[#e2eaf8]">฿ ชำระแล้ว</span>,
      'ACTIVE': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-[#eaf5ef] text-[#1a7a4a] border border-[#dcf0e5]">🏠 เข้าพัก</span>,
      'COMPLETED': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-[#eaf5ef] text-[#1a7a4a] border border-[#dcf0e5]">✓ เช็คเอาท์</span>,
      'CANCELLED': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-[#fafaf8] text-[#8a8780] border border-[#e2e0d8]">✕ ยกเลิก</span>,
    };
    return statusMap[s] || <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">{s}</span>;
  };

  const getRoomName = (roomId: number) => rooms.find(r => r.id === roomId)?.name || `ID:${roomId}`;

  const filtered = bookings.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchRoom = roomFilter === 'all' || String(b.roomId) === roomFilter;
    const matchSearch = String(b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchRoom && matchSearch;
  });

  // ===== VIEW BOOKING DETAIL =====
  const onViewDetail = (b: Booking) => {
    SwalStyled.fire({
      title: '📋 รายละเอียดการจอง',
      html: `
        <div style="text-align:left; font-size:13px; line-height:2.2;">
          <div style="display:grid; grid-template-columns: 120px 1fr; gap: 4px 12px;">
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">ผู้เข้าพัก</span>
            <span style="font-weight:700;">${b.customerName || '—'}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">เบอร์โทร</span>
            <span>${b.customerLine || '—'}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">ห้องพัก</span>
            <span style="font-weight:700;">${getRoomName(b.roomId)}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">เช็คอิน</span>
            <span style="font-family:monospace;">${formatDate(b.checkIn)}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">เช็คเอาท์</span>
            <span style="font-family:monospace;">${formatDate(b.checkOut)}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">ยอดเงิน</span>
            <span style="font-family:monospace; color:#c9440f; font-weight:700;">฿${Number(b.totalPrice || 0).toLocaleString()}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">PIN</span>
            <span style="font-family:monospace; font-weight:700;">${b.pinCode || '—'}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">สร้างเมื่อ</span>
            <span style="font-family:monospace; font-size:12px;">${formatDate(b.createdAt)}</span>
          </div>
        </div>
      `,
      confirmButtonText: 'ปิด',
      width: 480,
    });
  };

  // ===== EDIT BOOKING =====
  const onEditBooking = async (b: Booking) => {
    const roomOptions = rooms.map(r => `<option value="${r.id}" ${r.id === b.roomId ? 'selected' : ''}>${r.name}</option>`).join('');
    const statusOptions = [
      { value: 'PENDING', label: 'รอชำระเงิน' },
      { value: 'PAID', label: 'ชำระแล้ว' },
      { value: 'ACTIVE', label: 'เข้าพัก' },
      { value: 'COMPLETED', label: 'เช็คเอาท์แล้ว' },
      { value: 'CANCELLED', label: 'ยกเลิก' },
    ].map(s => `<option value="${s.value}" ${s.value === b.status ? 'selected' : ''}>${s.label}</option>`).join('');

    const { value: formValues } = await SwalStyled.fire({
      title: '✏️ แก้ไขการจอง',
      html: `
        <div style="text-align:left;">
          <label class="swal-form-label">ชื่อผู้เข้าพัก</label>
          <input id="swal-name" class="swal-form-input" value="${b.customerName || ''}" placeholder="ชื่อผู้เข้าพัก">

          <label class="swal-form-label">LINE / เบอร์โทร</label>
          <input id="swal-line" class="swal-form-input" value="${b.customerLine || ''}" placeholder="081-xxx-xxxx">

          <div class="swal-form-row">
            <div>
              <label class="swal-form-label">ห้องพัก</label>
              <select id="swal-room" class="swal-form-select">${roomOptions}</select>
            </div>
            <div>
              <label class="swal-form-label">สถานะ</label>
              <select id="swal-status" class="swal-form-select">${statusOptions}</select>
            </div>
          </div>

          <div class="swal-form-row">
            <div>
              <label class="swal-form-label">เช็คอิน</label>
              <input id="swal-checkin" type="date" class="swal-form-input" value="${toInputDate(b.checkIn)}">
            </div>
            <div>
              <label class="swal-form-label">เช็คเอาท์</label>
              <input id="swal-checkout" type="date" class="swal-form-input" value="${toInputDate(b.checkOut)}">
            </div>
          </div>

          <div class="swal-form-row">
            <div>
              <label class="swal-form-label">ยอดเงิน (฿)</label>
              <input id="swal-price" type="number" class="swal-form-input" value="${b.totalPrice || 0}">
            </div>
            <div>
              <label class="swal-form-label">PIN Code</label>
              <input id="swal-pin" class="swal-form-input" value="${b.pinCode || ''}" placeholder="เช่น 1234">
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '💾 บันทึก',
      cancelButtonText: 'ยกเลิก',
      width: 520,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        if (!name.trim()) {
          Swal.showValidationMessage('กรุณากรอกชื่อผู้เข้าพัก');
          return false;
        }
        return {
          customerName: name,
          customerLine: (document.getElementById('swal-line') as HTMLInputElement).value,
          roomId: Number((document.getElementById('swal-room') as HTMLSelectElement).value),
          status: (document.getElementById('swal-status') as HTMLSelectElement).value,
          checkIn: (document.getElementById('swal-checkin') as HTMLInputElement).value,
          checkOut: (document.getElementById('swal-checkout') as HTMLInputElement).value,
          totalPrice: Number((document.getElementById('swal-price') as HTMLInputElement).value) || 0,
          pinCode: (document.getElementById('swal-pin') as HTMLInputElement).value || null,
        };
      },
    });

    if (formValues) {
      try {
        await backend.updateBooking(b.id, formValues);
        SwalStyled.fire({ icon: 'success', title: 'บันทึกสำเร็จ!', text: 'อัปเดตข้อมูลการจองเรียบร้อยแล้ว', timer: 1800, showConfirmButton: false });
        fetchData();
      } catch (err: any) {
        SwalStyled.fire('ล้มเหลว', err.message, 'error');
      }
    }
  };

  // ===== DELETE BOOKING =====
  const onDeleteBooking = async (b: Booking) => {
    const result = await SwalStyled.fire({
      title: '🗑️ ลบการจอง?',
      html: `<div style="font-size:13px;">คุณต้องการลบการจองของ <strong>${b.customerName}</strong> หรือไม่?<br/><span style="color:#f87060; font-size:11px;">การกระทำนี้ไม่สามารถย้อนกลับได้</span></div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ ลบเลย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
    });

    if (result.isConfirmed) {
      try {
        await backend.deleteBooking(b.id);
        SwalStyled.fire({ icon: 'success', title: 'ลบสำเร็จ!', timer: 1500, showConfirmButton: false });
        fetchData();
      } catch (err: any) {
        SwalStyled.fire('ล้มเหลว', err.message, 'error');
      }
    }
  };

  // ===== CHANGE STATUS =====
  const onChangeStatus = async (b: Booking) => {
    const statusOptions = [
      { value: 'PENDING', label: '⏳ รอชำระเงิน' },
      { value: 'PAID', label: '฿ ชำระแล้ว' },
      { value: 'ACTIVE', label: '🏠 เข้าพัก' },
      { value: 'COMPLETED', label: '✓ เช็คเอาท์' },
      { value: 'CANCELLED', label: '✕ ยกเลิก' },
    ];

    const { value: status } = await SwalStyled.fire({
      title: '🔄 เปลี่ยนสถานะ',
      html: `<div style="font-size:13px; margin-bottom:4px;">การจองของ <strong>${b.customerName}</strong></div>`,
      input: 'select',
      inputOptions: Object.fromEntries(statusOptions.map(s => [s.value, s.label])),
      inputValue: b.status,
      showCancelButton: true,
      confirmButtonText: '💾 บันทึก',
      cancelButtonText: 'ยกเลิก',
    });

    if (status) {
      try {
        await backend.updateBookingStatus(b.id, status as BookingStatus);
        SwalStyled.fire({ icon: 'success', title: 'อัปเดตสำเร็จ!', timer: 1500, showConfirmButton: false });
        fetchData();
      } catch (err: any) {
        SwalStyled.fire('ล้มเหลว', err.message, 'error');
      }
    }
  };

  // ===== CREATE BOOKING =====
  const onCreateBooking = async () => {
    const now = new Date();
    const checkInDefault = now.toISOString().split('T')[0];
    now.setDate(now.getDate() + 1);
    const checkOutDefault = now.toISOString().split('T')[0];
    const roomOptions = rooms.filter(r => r.isActive).map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    const { value: formValues } = await SwalStyled.fire({
      title: '➕ สร้างการจองใหม่',
      html: `
        <div style="text-align:left;">
          <label class="swal-form-label">ชื่อผู้เข้าพัก *</label>
          <input id="swal-name" class="swal-form-input" placeholder="ชื่อ-นามสกุล">

          <label class="swal-form-label">เบอร์โทร / LINE</label>
          <input id="swal-line" class="swal-form-input" placeholder="081-xxx-xxxx">

          <label class="swal-form-label">ห้องพัก *</label>
          <select id="swal-room" class="swal-form-select">
            <option value="">-- เลือกห้อง --</option>
            ${roomOptions}
          </select>

          <div class="swal-form-row">
            <div>
              <label class="swal-form-label">เช็คอิน *</label>
              <input id="swal-checkin" type="date" value="${checkInDefault}" class="swal-form-input">
            </div>
            <div>
              <label class="swal-form-label">เช็คเอาท์ *</label>
              <input id="swal-checkout" type="date" value="${checkOutDefault}" class="swal-form-input">
            </div>
          </div>

          <label class="swal-form-label">ยอดเงิน (฿)</label>
          <input id="swal-price" type="number" value="500" class="swal-form-input">
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
        if (!checkIn || !checkOut) { Swal.showValidationMessage('กรุณาเลือกวันที่'); return false; }
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
        fetchData();
      } catch (err: any) {
        SwalStyled.fire('ล้มเหลว', err.message, 'error');
      }
    }
  };

  const tabs = [
    { id: 'all', label: 'ทั้งหมด', count: bookings.length },
    { id: 'PENDING', label: 'รอชำระ', count: bookings.filter(b => b.status === 'PENDING').length },
    { id: 'PAID', label: 'ชำระแล้ว', count: bookings.filter(b => b.status === 'PAID').length },
    { id: 'ACTIVE', label: 'เข้าพัก', count: bookings.filter(b => b.status === 'ACTIVE').length },
    { id: 'COMPLETED', label: 'เช็คเอาท์', count: bookings.filter(b => b.status === 'COMPLETED').length },
    { id: 'CANCELLED', label: 'ยกเลิก', count: bookings.filter(b => b.status === 'CANCELLED').length },
  ];

  if (loading) return (
    <div className="py-20 flex justify-center text-[#8a8780]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#c9440f] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] font-mono font-bold">กำลังโหลดข้อมูลรายการจอง...</span>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white border border-[#e2e0d8] rounded-2xl overflow-hidden shadow-sm">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#e2e0d8] flex items-center justify-between">
          <div className="text-[16px] font-bold tracking-tight text-[#1a1916]">รายการจองห้องพัก</div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-2.5 rounded-xl border border-[#e2e0d8] text-[#8a8780] hover:bg-[#fafaf8] transition-all active:scale-95">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onCreateBooking} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9440f] text-white text-[13px] font-bold hover:bg-[#b03b0d] transition-all active:scale-95 shadow-lg shadow-[#c9440f]/20">
              <Plus className="w-4 h-4" /> เพิ่มการจอง
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-[#e2e0d8] px-4 bg-[#fafaf8]">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              className={`py-4 px-4 text-[13px] whitespace-nowrap border-b-2 -mb-[px] transition-all flex items-center gap-2.5 ${
                statusFilter === t.id ? 'border-[#c9440f] text-[#c9440f] font-bold' : 'border-transparent text-[#8a8780] hover:text-[#1a1916]'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${
                  statusFilter === t.id ? 'bg-[#c9440f] text-white' : 'bg-[#e2e0d8] text-[#8a8780]'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Global Filter Bar */}
        <div className="p-4 border-b border-[#e2e0d8] flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8780]" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อผู้เข้าพัก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#e2e0d8] rounded-xl pl-11 pr-4 py-2.5 text-[14px] outline-none focus:ring-4 focus:ring-[#c9440f]/5 focus:border-[#c9440f] bg-white transition-all shadow-sm"
            />
          </div>
          <select
            className="border border-[#e2e0d8] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white font-medium cursor-pointer hover:bg-[#fafaf8] transition-all focus:border-[#c9440f]"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="all">ทุกห้องพัก</option>
            {rooms.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
          </select>
        </div>

        {/* THE REQUESTED BOX LAYOUT */}
        <div className="p-4 sm:p-6 bg-[#fcfbf9] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white border border-[#e2e0d8] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group border-b-4 border-b-transparent hover:border-b-[#c9440f]">
              {/* Card Header: Guest Details */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="font-bold text-[18px] text-[#1a1916] leading-tight mb-1 truncate">{b.customerName || 'ไม่ระบุชื่อ'}</div>
                  <div className="text-[13px] text-[#8a8780] font-bold">{b.customerLine || 'ไม่มีข้อมูลเบอร์ติดต่อ'}</div>
                </div>
                <button onClick={() => onChangeStatus(b)} className="flex-shrink-0 active:scale-95 transition-transform">
                  {statusBadge(b.status)}
                </button>
              </div>

              {/* Card Info: Room and Booking Period */}
              <div className="bg-[#fafafa] border border-[#f0f0f0] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1a1916] text-[#c9440f] flex items-center justify-center font-bold text-[15px] shadow-sm">
                    {getRoomName(b.roomId).replace(/\D/g, '') || 'R'}
                  </div>
                  <div className="font-bold text-[16px] text-[#1a1916]">{getRoomName(b.roomId)}</div>
                </div>
                
                <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-3 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#8a8780] mb-1">Check-in</span>
                    <span className="font-mono font-bold text-[14px] text-[#1a1916]">{formatShortDate(b.checkIn)}</span>
                  </div>
                  <div className="text-[#e2e0d8] font-light text-[20px]">→</div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#8a8780] mb-1">Check-out</span>
                    <span className="font-mono font-bold text-[14px] text-[#1a1916]">{formatShortDate(b.checkOut)}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions: Primary Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button 
                  onClick={() => onViewDetail(b)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#eaf0fb] text-[#1a4fa0] text-[13px] font-bold hover:bg-[#dce6f7] transition-all active:scale-95"
                >
                  <Eye className="w-4 h-4" /> ดูรายละเอียด
                </button>
                
                <div className="flex gap-2">
                  <button onClick={() => onEditBooking(b)} className="p-2.5 rounded-xl border border-[#fdf3d0] bg-[#fdf8e7] text-[#b58a00] hover:bg-[#fcf1c5] transition-all active:scale-95" title="แก้ไข">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleteBooking(b)} className="p-2.5 rounded-xl border border-[#fee2e2] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fde2e2] transition-all active:scale-95" title="ลบ">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty Display */}
          {filtered.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white border border-[#e2e0d8] border-dashed rounded-[32px]">
              <div className="text-[64px] mb-4 grayscale opacity-20">📭</div>
              <div className="text-[15px] text-[#8a8780] font-bold">ไม่พบรายการห้องพักที่จองในช่วงนี้</div>
            </div>
          )}
        </div>

        {/* Page Footer: Summary Statistics */}
        <div className="p-5 bg-white border-t border-[#e2e0d8] flex flex-col sm:flex-row items-center justify-between gap-5 text-[14px]">
          <div className="text-[#8a8780] font-medium">แสดง <span className="font-bold text-[#1a1916]">{filtered.length}</span> จากทั้งหมด <span className="font-bold text-[#1a1916]">{bookings.length}</span> รายการ</div>
          <div className="flex items-center gap-3 bg-[#fafaf8] px-6 py-3 rounded-2xl border border-[#e2e0d8] shadow-inner">
            <span className="text-[#8a8780] font-bold">ยอดรายได้รวมส่วนนี้:</span>
            <span className="font-mono font-extrabold text-[#c9440f] text-[18px]">฿{filtered.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
