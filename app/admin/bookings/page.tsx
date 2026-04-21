'use client';

import React, { useState, useEffect } from 'react';
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

  const toInputDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toISOString().split('T')[0];
    } catch { return ''; }
  };

  const statusBadge = (s: BookingStatus) => {
    const statusMap: Record<BookingStatus, React.ReactNode> = {
      'PENDING': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-[#fdf8e7] text-[#b58a00]">⏳ รอชำระ</span>,
      'PAID': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-[#eaf0fb] text-[#1a4fa0]">฿ ชำระแล้ว</span>,
      'ACTIVE': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-[#eaf5ef] text-[#1a7a4a]">🏠 เข้าพัก</span>,
      'COMPLETED': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-[#eaf5ef] text-[#1a7a4a]">✓ เช็คเอาท์</span>,
      'CANCELLED': <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-[#fafaf8] text-[#8a8780]">✕ ยกเลิก</span>,
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
            <span style="font-weight:500;">${b.customerName || '—'}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">LINE</span>
            <span>${b.customerLine || '—'}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">ห้องพัก</span>
            <span>${getRoomName(b.roomId)}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">เช็คอิน</span>
            <span style="font-family:monospace;">${formatDate(b.checkIn)}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">เช็คเอาท์</span>
            <span style="font-family:monospace;">${formatDate(b.checkOut)}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">ยอดเงิน</span>
            <span style="font-family:monospace; color:#c9440f; font-weight:600;">฿${Number(b.totalPrice || 0).toLocaleString()}</span>
            <span style="color:rgba(240,236,232,0.4); font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">PIN</span>
            <span style="font-family:monospace;">${b.pinCode || '—'}</span>
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

          <label class="swal-form-label">LINE ID</label>
          <input id="swal-line" class="swal-form-input" value="${b.customerLine || ''}" placeholder="@line_id">

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
      { value: 'PENDING', label: '⏳ รอชำระเงิน', color: '#b58a00' },
      { value: 'PAID', label: '฿ ชำระแล้ว', color: '#1a4fa0' },
      { value: 'ACTIVE', label: '🏠 เข้าพัก', color: '#1a7a4a' },
      { value: 'COMPLETED', label: '✓ เช็คเอาท์', color: '#1a7a4a' },
      { value: 'CANCELLED', label: '✕ ยกเลิก', color: '#8a8780' },
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
    let now = new Date()
    const checkInDefult = now.toISOString().split('T')[0];
    now.setDate(now.getDate() + 1);
    const checkOutDefult = now.toISOString().split('T')[0];
    const roomOptions = rooms.filter(r => r.isActive).map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    const priceDefult = 500;

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
              <input id="swal-checkin" type="date" value=${checkInDefult} class="swal-form-input">
            </div>
            <div>
              <label class="swal-form-label">เช็คเอาท์ *</label>
              <input id="swal-checkout" type="date" value=${checkOutDefult} class="swal-form-input">
            </div>
          </div>

          <label class="swal-form-label">ยอดเงิน (฿)</label>
          <input id="swal-price" type="number" value=${priceDefult} class="swal-form-input" placeholder="0">
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
        <span className="text-[13px] font-mono">กำลังโหลดข้อมูลรายการจอง...</span>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white border border-[#e2e0d8] rounded-lg mb-5 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e2e0d8] flex items-center justify-between">
          <div className="text-[13px] font-semibold tracking-[0.3px]">รายการจองทั้งหมด</div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-1.5 rounded-md border border-[#d0cdc2] text-[#8a8780] hover:bg-[#f5f4f0] transition-colors" title="รีเฟรช">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onCreateBooking} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#c9440f] text-white text-[12px] font-medium hover:bg-[#e04d12] transition-colors">
              <Plus className="w-3.5 h-3.5" /> เพิ่มการจอง
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e2e0d8] px-5 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              className={`py-3 px-4 text-[13px] whitespace-nowrap border-b-2 -mb-[1px] transition-colors flex items-center gap-1.5 ${statusFilter === t.id
                ? 'border-[#c9440f] text-[#1a1916] font-medium'
                : 'border-transparent text-[#8a8780] hover:text-[#1a1916]'
                }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${statusFilter === t.id ? 'bg-[#c9440f]/10 text-[#c9440f]' : 'bg-[#f5f4f0] text-[#8a8780]'
                  }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 p-3.5 px-4 border-b border-[#e2e0d8] bg-[#fafaf8]">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8780]" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้เข้าพัก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#d0cdc2] rounded-md pl-8 pr-3 py-1.5 text-[12px] outline-none focus:border-[#c9440f] bg-white transition-colors"
            />
          </div>
          <select
            className="border border-[#d0cdc2] rounded-md px-2.5 py-1.5 text-[12px] bg-white outline-none cursor-pointer"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="all">ทุกห้อง</option>
            {rooms.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#fafaf8]">
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]">ผู้เข้าพัก</th>
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]">ห้อง</th>
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]">เช็คอิน / เอาท์</th>
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]">ยอด</th>
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8]">สถานะ</th>
                <th className="py-2.5 px-4 text-[10px] font-semibold text-[#8a8780] uppercase tracking-[0.8px] border-b border-[#e2e0d8] text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} className="hover:bg-[#fafaf8] group transition-colors">
                  <td className="py-3 px-4 border-b border-[#e2e0d8]">
                    <div className="font-medium">{b.customerName || '-'}</div>
                    {b.customerLine && <div className="text-[11px] text-[#8a8780] mt-0.5">{b.customerLine}</div>}
                  </td>
                  <td className="py-3 px-4 border-b border-[#e2e0d8] text-[#8a8780]">{getRoomName(b.roomId)}</td>
                  <td className="py-3 px-4 border-b border-[#e2e0d8] font-mono text-[12px]">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</td>
                  <td className="py-3 px-4 border-b border-[#e2e0d8] font-mono">{b.totalPrice != null ? `฿${Number(b.totalPrice).toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-4 border-b border-[#e2e0d8]">
                    <button onClick={() => onChangeStatus(b)} className="hover:opacity-80 transition-opacity">
                      {statusBadge(b.status)}
                    </button>
                  </td>
                  <td className="py-3 px-4 border-b border-[#e2e0d8]">
                    <div className="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onViewDetail(b)} className="p-1.5 rounded-md hover:bg-[#eaf0fb] text-[#1a4fa0] transition-colors" title="ดูรายละเอียด">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onEditBooking(b)} className="p-1.5 rounded-md hover:bg-[#fdf8e7] text-[#b58a00] transition-colors" title="แก้ไข">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDeleteBooking(b)} className="p-1.5 rounded-md hover:bg-[#fef2f2] text-[#dc2626] transition-colors" title="ลบ">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-[#8a8780]">
                  <div className="text-[28px] mb-2">📭</div>
                  <div className="text-[13px]">ไม่มีรายการจองในหมวดหมู่นี้</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#fafaf8] border-t border-[#e2e0d8] text-[11px] text-[#8a8780] flex items-center justify-between">
          <span>แสดง {filtered.length} จาก {bookings.length} รายการ</span>
          <span className="font-mono">รายได้รวม: ฿{filtered.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
