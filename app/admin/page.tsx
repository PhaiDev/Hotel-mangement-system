'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { backend, Booking, BookingStatus } from '@/lib/supabase';
import Link from 'next/link';
import { RefreshCw, Eye } from 'lucide-react';
import useSWR from 'swr';
import BookingModal from '@/components/BookingModal';
import BookingDetailModal from '@/components/BookingDetailModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const { data: rooms = [], mutate: mutateRooms, isLoading: loadingRooms } = useSWR('rooms', backend.getRooms, { revalidateOnFocus: true });
  const { data: bookings = [], mutate: mutateBookings, isLoading: loadingBookings } = useSWR('bookings', backend.getBookings, { revalidateOnFocus: true });
  const loading = loadingRooms || loadingBookings;

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
  const [bookingToView, setBookingToView] = useState<Booking | null>(null);

  const fetchAllData = async () => {
    await Promise.all([mutateRooms(), mutateBookings()]);
  };

  // ===== CREATE BOOKING from Dashboard =====
  const onCreateBooking = useCallback(() => {
    setIsBookingModalOpen(true);
  }, [setIsBookingModalOpen]);

  useEffect(() => {
    // Listen for booking modal trigger from header button
    const handler = () => onCreateBooking();
    window.addEventListener('open-booking-modal', handler);
    return () => {
      window.removeEventListener('open-booking-modal', handler);
    };
  }, [onCreateBooking]);

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


  // ===== VIEW DETAIL from Dashboard =====
  const onViewDetail = (b: Booking) => {
    setBookingToView(b);
    setIsBookingDetailOpen(true);
  };

  // --- Analytics Data Prep (Last 7 Days) ---
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const labels = last7Days.map(getDayLabel);

  const revenueData = {
    labels,
    datasets: [
      {
        label: 'รายได้ (บาท)',
        data: last7Days.map(date => {
          return bookings
            .filter(b => b.status !== 'CANCELLED' && b.checkIn.startsWith(date))
            .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
        }),
        backgroundColor: '#1a4fa0',
        borderRadius: 4,
      }
    ]
  };

  const occupancyData = {
    labels,
    datasets: [
      {
        label: 'จำนวนห้องที่เข้าพัก',
        data: last7Days.map(date => {
          const dateTime = new Date(date).getTime();
          const bookedRooms = new Set(
            bookings
              .filter(b => b.status !== 'CANCELLED')
              .filter(b => {
                const bIn = new Date(b.checkIn.split('T')[0]).getTime();
                const bOut = new Date(b.checkOut.split('T')[0]).getTime();
                return bIn <= dateTime && bOut > dateTime;
              })
              .map(b => b.roomId)
          );
          return bookedRooms.size;
        }),
        borderColor: '#c9440f',
        backgroundColor: 'rgba(201, 68, 15, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, border: { dash: [4, 4] }, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1 } },
      x: { grid: { display: false } }
    }
  };

  const revenueOptions = {
    ...chartOptions,
    scales: {
      y: { beginAtZero: true, border: { dash: [4, 4] }, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } }
    }
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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Occupancy Chart */}
        <div className="bg-white border border-[#e2e0d8] rounded-2xl p-5 shadow-sm">
          <div className="text-[14px] font-bold tracking-tight text-[#1a1916] mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9440f]"></span>
            แนวโน้มการเข้าพัก 7 วันย้อนหลัง
          </div>
          <div className="h-[250px]">
            <Line data={occupancyData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white border border-[#e2e0d8] rounded-2xl p-5 shadow-sm">
          <div className="text-[14px] font-bold tracking-tight text-[#1a1916] mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a4fa0]"></span>
            รายได้ 7 วันย้อนหลัง (บาท)
          </div>
          <div className="h-[250px]">
            <Bar data={revenueData} options={revenueOptions} />
          </div>
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

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={fetchAllData}
      />

      {bookingToView && (
        <BookingDetailModal
          isOpen={isBookingDetailOpen}
          onClose={() => setIsBookingDetailOpen(false)}
          booking={bookingToView}
          roomName={rooms.find(r => r.id === bookingToView.roomId)?.name || `ID:${bookingToView.roomId}`}
          roomPin={rooms.find(r => r.id === bookingToView.roomId)?.pinLock || null}
          onStatusChange={fetchAllData}
        />
      )}
    </div>
  );
}
