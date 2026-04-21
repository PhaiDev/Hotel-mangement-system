'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { backend, Room, Booking } from '@/lib/supabase';
import { SwalStyled, swalCSS } from '@/lib/swalTheme';
import { ChevronLeft, ChevronRight, Users, RefreshCw } from 'lucide-react';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const DAY_HEADERS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

// Convert Date to local YYYY-MM-DD string (avoids UTC timezone shift)
const toLocalDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function CalendarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

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
    const style = document.createElement('style');
    style.textContent = swalCSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Get all days in the current month view
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    // Add empty cells for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // Add each day of the month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }
    return days;
  }, [currentYear, currentMonth]);

  // Check if a room is booked on a given date
  const isRoomBookedOnDate = (roomId: number, date: Date): boolean => {
    const dateStr = toLocalDateStr(date);
    return bookings.some(b => {
      if (b.roomId !== roomId) return false;
      if (b.status === 'CANCELLED') return false;
      const checkIn = b.checkIn?.split('T')[0];
      const checkOut = b.checkOut?.split('T')[0];
      if (!checkIn || !checkOut) return false;
      return dateStr >= checkIn && dateStr < checkOut;
    });
  };

  // Get availability for a date
  const getDateAvailability = (date: Date) => {
    const activeRooms = rooms.filter(r => r.isActive);
    const totalRooms = activeRooms.length;
    if (totalRooms === 0) return { available: 0, total: 0, status: 'empty' as const };
    const bookedCount = activeRooms.filter(r => isRoomBookedOnDate(r.id, date)).length;
    const availableCount = totalRooms - bookedCount;

    let status: 'available' | 'almost' | 'full' | 'empty';
    if (availableCount === 0) status = 'full';
    else if (availableCount <= Math.ceil(totalRooms * 0.3)) status = 'almost';
    else status = 'available';

    return { available: availableCount, total: totalRooms, status };
  };

  // Get available rooms for selected date
  const getAvailableRoomsForDate = (date: Date) => {
    const activeRooms = rooms.filter(r => r.isActive);
    return activeRooms.map(room => {
      const isBooked = isRoomBookedOnDate(room.id, date);
      // Find the booking for this room on this date
      const booking = bookings.find(b => {
        if (b.roomId !== room.id || b.status === 'CANCELLED') return false;
        const checkIn = b.checkIn?.split('T')[0];
        const checkOut = b.checkOut?.split('T')[0];
        const dateStr = toLocalDateStr(date);
        return dateStr >= (checkIn || '') && dateStr < (checkOut || '');
      });

      // Find the next booking for this room after this date
      const dateStr = toLocalDateStr(date);
      const nextBooking = bookings
        .filter(b => b.roomId === room.id && b.status !== 'CANCELLED' && (b.checkIn?.split('T')[0] || '') > dateStr)
        .sort((a, b) => (a.checkIn || '').localeCompare(b.checkIn || ''))[0];

      // Check if room is available for the entire rest of the month
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      let availableUntil: string | null = null;
      if (!isBooked) {
        if (nextBooking) {
          availableUntil = formatThaiDate(nextBooking.checkIn);
        } else {
          availableUntil = 'ว่างตลอดเดือนนี้';
        }
      }

      return {
        ...room,
        isBooked,
        booking,
        availableUntil,
        guestName: booking?.customerName || null,
      };
    });
  };

  const formatThaiDate = (date: Date | string) => {
    let d: Date;
    if (typeof date === 'string') {
      // Parse date string as local (avoid UTC shift)
      const parts = date.split('T')[0].split('-');
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = date;
    }
    const day = d.getDate();
    const month = THAI_MONTHS[d.getMonth()];
    const shortMonth = month.substring(0, 3) + '.';
    const year = d.getFullYear() + 543;
    return `${day} ${shortMonth} ${year}`;
  };

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isPast = (date: Date) => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  // Selected date info
  const selectedAvailability = getDateAvailability(selectedDate);
  const selectedRooms = getAvailableRoomsForDate(selectedDate);

  if (loading) return (
    <div className="py-20 flex justify-center text-[#8a8780]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#c9440f] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] font-mono">กำลังโหลดปฏิทิน...</span>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">ปฏิทินห้องว่าง</h1>
        <button onClick={fetchData} className="p-1.5 rounded-md border border-[#d0cdc2] text-[#8a8780] hover:bg-[#f5f4f0] transition-colors" title="รีเฟรช">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Calendar Section */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-[#e2e0d8] rounded-xl overflow-hidden shadow-sm">
            {/* Month Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e0d8]">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-lg hover:bg-[#f5f4f0] transition-colors text-[#8a8780] hover:text-[#1a1916]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="text-[16px] font-semibold">
                  {THAI_MONTHS[currentMonth]} {currentYear + 543}
                </div>
              </div>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-lg hover:bg-[#f5f4f0] transition-colors text-[#8a8780] hover:text-[#1a1916]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-[#e2e0d8]">
              {DAY_HEADERS.map((day, i) => (
                <div key={day} className={`py-3 text-center text-[11px] font-semibold uppercase tracking-[0.8px] ${i === 0 ? 'text-[#c9440f]' : 'text-[#8a8780]'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-[#e2e0d8]/30">
              {calendarDays.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="bg-white min-h-[72px]" />;
                }

                const availability = getDateAvailability(date);
                const past = isPast(date);
                const selected = isSelected(date);
                const todayDate = isToday(date);

                const statusColors = {
                  available: { dot: 'bg-[#1a7a4a]', bg: 'hover:bg-[#eaf5ef]', text: 'text-[#1a7a4a]', label: 'ว่าง' },
                  almost: { dot: 'bg-[#e88c2a]', bg: 'hover:bg-[#fdf8e7]', text: 'text-[#e88c2a]', label: 'ใกล้เต็ม' },
                  full: { dot: 'bg-[#dc2626]', bg: 'hover:bg-[#fef2f2]', text: 'text-[#dc2626]', label: 'เต็ม' },
                  empty: { dot: 'bg-[#8a8780]', bg: '', text: 'text-[#8a8780]', label: '—' },
                };
                const colors = statusColors[availability.status];

                return (
                  <button
                    key={toLocalDateStr(date)}
                    onClick={() => setSelectedDate(date)}
                    disabled={past}
                    className={`bg-white min-h-[72px] p-2 flex flex-col items-center justify-center gap-1 transition-all relative
                      ${past ? 'opacity-35 cursor-not-allowed' : `cursor-pointer ${colors.bg}`}
                      ${selected ? 'ring-2 ring-[#c9440f] ring-inset bg-[#c9440f]/5 z-10' : ''}
                      ${todayDate && !selected ? 'ring-2 ring-[#1a4fa0]/30 ring-inset' : ''}
                    `}
                  >
                    <span className={`text-[15px] font-medium ${selected ? 'text-[#c9440f]' : todayDate ? 'text-[#1a4fa0] font-bold' : 'text-[#1a1916]'}`}>
                      {date.getDate()}
                    </span>
                    {!past && (
                      <>
                        <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        <span className={`text-[9px] font-medium ${colors.text}`}>
                          {availability.status === 'full' ? 'เต็ม' : `${availability.available}/${availability.total}`}
                        </span>
                      </>
                    )}
                    {todayDate && (
                      <div className="absolute top-1 right-1.5 text-[8px] font-mono text-[#1a4fa0] font-bold">
                        วันนี้
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 py-3.5 border-t border-[#e2e0d8] bg-[#fafaf8]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1a7a4a]" />
                <span className="text-[11px] text-[#8a8780]">ว่าง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#e88c2a]" />
                <span className="text-[11px] text-[#8a8780]">ใกล้เต็ม</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
                <span className="text-[11px] text-[#8a8780]">เต็ม</span>
              </div>
            </div>
          </div>
        </div>

        {/* Room Availability Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#e2e0d8] rounded-xl overflow-hidden shadow-sm sticky top-20">
            {/* Panel Header */}
            <div className="p-5 border-b border-[#e2e0d8] bg-gradient-to-r from-[#1a1916] to-[#2a2520]">
              <div className="text-[11px] text-white/40 uppercase tracking-[0.8px] mb-1">ห้องว่าง</div>
              <div className="text-white font-semibold text-[16px]">
                {formatThaiDate(selectedDate)}
              </div>
              <div className="mt-2.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium font-mono ${selectedAvailability.status === 'full'
                  ? 'bg-[#dc2626]/20 text-[#ff6b6b]'
                  : selectedAvailability.status === 'almost'
                    ? 'bg-[#e88c2a]/20 text-[#e88c2a]'
                    : 'bg-[#1a7a4a]/20 text-[#4ade80]'
                  }`}>
                  ว่าง {selectedAvailability.available}/{selectedAvailability.total} ห้อง
                </span>
              </div>
            </div>

            {/* Room List */}
            <div className="divide-y divide-[#e2e0d8] max-h-[500px] overflow-y-auto">
              {selectedRooms.length === 0 && (
                <div className="py-12 text-center text-[#8a8780]">
                  <div className="text-[28px] mb-2">🏨</div>
                  <div className="text-[13px]">ไม่มีห้องพักในระบบ</div>
                </div>
              )}
              {selectedRooms.map(room => (
                <div
                  key={room.id}
                  className={`px-5 py-4 flex items-center gap-4 transition-colors ${room.isBooked ? 'bg-[#fafaf8] opacity-60' : 'hover:bg-[#fafaf8]'
                    }`}
                >
                  {/* Room Number Badge */}
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-mono text-[13px] font-bold shrink-0 ${room.isBooked
                    ? 'bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20'
                    : 'bg-[#1a7a4a]/10 text-[#1a7a4a] border border-[#1a7a4a]/20'
                    }`}>
                    {room.name.replace(/\D/g, '') || room.id}
                  </div>

                  {/* Room Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[14px]">{room.name}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-[#8a8780]">
                        <Users className="w-3 h-3" /> {room.capacity}
                      </span>
                    </div>
                    <div className={`text-[11px] mt-0.5 ${room.isBooked ? 'text-[#dc2626]' : 'text-[#1a7a4a]'}`}>
                      {room.isBooked
                        ? `🔒 ${room.guestName || 'มีผู้จอง'}`
                        : room.availableUntil === 'ว่างตลอดเดือนนี้'
                          ? '✓ ว่างตลอดเดือนนี้'
                          : `✓ ว่างถึง ${room.availableUntil}`
                      }
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className={`w-3 h-3 rounded-full shrink-0 ${room.isBooked ? 'bg-[#dc2626]' : 'bg-[#1a7a4a]'}`} />
                </div>
              ))}
            </div>

            {/* Quick Stats Footer */}
            <div className="p-4 border-t border-[#e2e0d8] bg-[#fafaf8]">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-mono text-[18px] font-medium text-[#1a7a4a]">
                    {selectedRooms.filter(r => !r.isBooked).length}
                  </div>
                  <div className="text-[10px] text-[#8a8780] uppercase">ว่าง</div>
                </div>
                <div>
                  <div className="font-mono text-[18px] font-medium text-[#dc2626]">
                    {selectedRooms.filter(r => r.isBooked).length}
                  </div>
                  <div className="text-[10px] text-[#8a8780] uppercase">จอง</div>
                </div>
                <div>
                  <div className="font-mono text-[18px] font-medium text-[#1a1916]">
                    {selectedRooms.length}
                  </div>
                  <div className="text-[10px] text-[#8a8780] uppercase">ทั้งหมด</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
