'use client';

import React, { useState, useEffect } from 'react';
import { backend, Booking, BookingStatus } from '@/lib/supabase';
import { SwalStyled, swalCSS } from '@/lib/swalTheme';

import { Pencil, Trash2, Eye, RefreshCw, Plus, Search, LogIn, LogOut, CheckCircle2, FileDown } from 'lucide-react';
import useSWR from 'swr';
import BookingModal from '@/components/BookingModal';
import BookingDetailModal from '@/components/BookingDetailModal';

export default function BookingsPage() {
  const { data: rooms = [], mutate: mutateRooms, isLoading: loadingRooms } = useSWR('rooms', backend.getRooms, { revalidateOnFocus: true });
  const { data: bookings = [], mutate: mutateBookings, isLoading: loadingBookings } = useSWR('bookings', backend.getBookings, { revalidateOnFocus: true });
  const loading = loadingRooms || loadingBookings;

  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingModalMode, setBookingModalMode] = useState<'daily' | 'temporary' | 'custom'>('daily');
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalBooking, setDetailModalBooking] = useState<Booking | null>(null);

  const fetchData = async () => {
    await Promise.all([mutateRooms(), mutateBookings()]);
  };

  useEffect(() => {
    // Inject swal CSS
    const style = document.createElement('style');
    style.textContent = swalCSS;
    document.head.appendChild(style);
    return () => { if (document.head.contains(style)) document.head.removeChild(style); };
  }, []);



  const formatShortDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    } catch { return isoString; }
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
    setDetailModalBooking(b);
    setIsDetailModalOpen(true);
  };

  // ===== EDIT BOOKING =====
  const onEditBooking = async (b: Booking) => {
    setBookingToEdit(b);
    setIsBookingModalOpen(true);
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
      } catch (err: unknown) {
        SwalStyled.fire('ล้มเหลว', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error');
      }
    }
  };

  // ===== CHANGE STATUS =====
  const onChangeStatus = async (b: Booking) => {
    // We now just open the detail modal which has a beautiful status changer inside
    setDetailModalBooking(b);
    setIsDetailModalOpen(true);
  };

  // ===== QUICK STATUS CHANGE (ONE-CLICK) =====
  const handleQuickStatusChange = async (b: Booking, newStatus: BookingStatus) => {
    try {
      await backend.updateBooking(b.id, { status: newStatus });
      SwalStyled.fire({ icon: 'success', title: 'อัปเดตสถานะสำเร็จ!', timer: 1000, showConfirmButton: false });
      fetchData();
    } catch (err: unknown) {
      SwalStyled.fire('ล้มเหลว', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error');
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

  if (loading && bookings.length === 0) return (
    <div className="py-20 flex justify-center text-[#8a8780]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#c9440f] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] font-mono font-bold">กำลังโหลดข้อมูลรายการจอง...</span>
      </div>
    </div>
  );

  const exportToCSV = () => {
    if (filtered.length === 0) {
      SwalStyled.fire('ไม่มีข้อมูล', 'ไม่มีข้อมูลการจองในตารางสำหรับส่งออก', 'info');
      return;
    }

    const headers = ['รหัสการจอง', 'ชื่อลูกค้า', 'เบอร์ติดต่อ/LINE', 'ห้องพัก', 'วันที่เช็คอิน', 'วันที่เช็คเอาท์', 'ยอดเงิน', 'สถานะ', 'วันที่สร้าง'];
    
    const csvRows = [headers.join(',')];
    
    filtered.forEach(b => {
      const roomName = getRoomName(b.roomId);
      const escapeCsv = (str: string) => `"${String(str || '').replace(/"/g, '""')}"`;
      
      const row = [
        b.id,
        escapeCsv(b.customerName),
        escapeCsv(b.customerLine),
        escapeCsv(roomName),
        b.checkIn.split('T')[0],
        b.checkOut.split('T')[0],
        b.totalPrice,
        b.status,
        b.createdAt.split('T')[0]
      ];
      csvRows.push(row.join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\n'); 
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white border border-[#e2e0d8] rounded-2xl overflow-hidden shadow-sm">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#e2e0d8] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="text-[16px] font-bold tracking-tight text-[#1a1916]">รายการจองห้องพัก</div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button onClick={exportToCSV} className="p-2.5 rounded-xl border border-[#e2e0d8] text-[#1a7a4a] bg-[#eaf5ef] hover:bg-[#d4ede1] transition-all active:scale-95" title="ส่งออก CSV">
              <FileDown className="w-4 h-4" />
            </button>
            <button onClick={fetchData} className="p-2.5 rounded-xl border border-[#e2e0d8] text-[#8a8780] hover:bg-[#fafaf8] transition-all active:scale-95" title="รีเฟรช">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => { setBookingModalMode('daily'); setIsBookingModalOpen(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#c9440f] text-white text-[13px] font-bold hover:bg-[#b03b0d] transition-all active:scale-95 shadow-lg shadow-[#c9440f]/20 whitespace-nowrap">
              <Plus className="w-4 h-4" /> เพิ่มการจองด่วน (รายวัน)
            </button>
            <button onClick={() => { setBookingModalMode('temporary'); setIsBookingModalOpen(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#c9440f] text-white text-[13px] font-bold hover:bg-[#b03b0d] transition-all active:scale-95 shadow-lg shadow-[#c9440f]/20 whitespace-nowrap">
              <Plus className="w-4 h-4" /> เพิ่มการจองชั่วคราว
            </button>
            <button onClick={() => { setBookingModalMode('custom'); setIsBookingModalOpen(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#c9440f] text-white text-[13px] font-bold hover:bg-[#b03b0d] transition-all active:scale-95 shadow-lg shadow-[#c9440f]/20 whitespace-nowrap">
              <Plus className="w-4 h-4" /> เพิ่มการจองอิสระ
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-[#e2e0d8] px-4 bg-[#fafaf8]">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              className={`py-4 px-4 text-[13px] whitespace-nowrap border-b-2 -mb-[px] transition-all flex items-center gap-2.5 ${statusFilter === t.id ? 'border-[#c9440f] text-[#c9440f] font-bold' : 'border-transparent text-[#8a8780] hover:text-[#1a1916]'
                }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${statusFilter === t.id ? 'bg-[#c9440f] text-white' : 'bg-[#e2e0d8] text-[#8a8780]'
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
                {/* QUICK ACTION BUTTONS */}
                {b.status === 'PENDING' && (
                  <button onClick={() => handleQuickStatusChange(b, 'PAID')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#eaf5ef] text-[#1a7a4a] text-[13px] font-bold hover:bg-[#d5ebd9] transition-all active:scale-95 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> รับชำระเงิน
                  </button>
                )}
                {b.status === 'PAID' && (
                  <button onClick={() => handleQuickStatusChange(b, 'ACTIVE')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#eaf0fb] text-[#1a4fa0] text-[13px] font-bold hover:bg-[#dce6f7] transition-all active:scale-95 shadow-sm">
                    <LogIn className="w-4 h-4" /> เช็คอิน
                  </button>
                )}
                {b.status === 'ACTIVE' && (
                  <button onClick={() => handleQuickStatusChange(b, 'COMPLETED')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#fef2f2] text-[#dc2626] text-[13px] font-bold hover:bg-[#fde2e2] transition-all active:scale-95 shadow-sm">
                    <LogOut className="w-4 h-4" /> เช็คเอาท์
                  </button>
                )}
                {(b.status === 'COMPLETED' || b.status === 'CANCELLED') && (
                  <button onClick={() => onViewDetail(b)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#fafaf8] border border-[#e2e0d8] text-[#1a1916] text-[13px] font-bold hover:bg-[#f5f4f0] transition-all active:scale-95 shadow-sm">
                    <Eye className="w-4 h-4" /> ดูรายละเอียด
                  </button>
                )}

                <div className="flex gap-1.5">
                  {(b.status === 'PENDING' || b.status === 'PAID' || b.status === 'ACTIVE') && (
                    <button onClick={() => onViewDetail(b)} className="p-2.5 rounded-xl border border-[#e2e0d8] bg-white text-[#8a8780] hover:bg-[#fafaf8] transition-all active:scale-95 shadow-sm" title="รายละเอียด">
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => onEditBooking(b)} className="p-2.5 rounded-xl border border-[#fdf3d0] bg-[#fdf8e7] text-[#b58a00] hover:bg-[#fcf1c5] transition-all active:scale-95 shadow-sm" title="แก้ไข">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleteBooking(b)} className="p-2.5 rounded-xl border border-[#fee2e2] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fde2e2] transition-all active:scale-95 shadow-sm" title="ลบ">
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

      <BookingModal
        isOpen={isBookingModalOpen}
        initialMode={bookingModalMode}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingToEdit(null);
        }}
        onSuccess={() => {
          fetchData();
          SwalStyled.fire({ icon: 'success', title: bookingToEdit ? 'บันทึกสำเร็จ!' : 'สร้างการจองสำเร็จ!', timer: 1500, showConfirmButton: false });
        }}
        bookingToEdit={bookingToEdit ?? undefined}
      />

      <BookingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        booking={detailModalBooking}
        roomName={detailModalBooking ? getRoomName(detailModalBooking.roomId) : ''}
        roomPin={detailModalBooking ? rooms.find(r => r.id === detailModalBooking.roomId)?.pinLock || null : null}
        onStatusChange={() => {
          fetchData();
        }}
      />
    </div>
  );
}
