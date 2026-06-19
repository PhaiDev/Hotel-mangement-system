'use client';

import React, { useState, useMemo } from 'react';
import { Room, Booking } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { backend } from '@/lib/supabase';
import BookingDetailModal from '@/components/BookingDetailModal';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export default function TimelinePage() {
  const { data: rooms = [], isLoading: loadingRooms } = useSWR('rooms', backend.getRooms, { revalidateOnFocus: true });
  const { data: bookings = [], isLoading: loadingBookings } = useSWR('bookings', backend.getBookings, { revalidateOnFocus: true });
  const loading = loadingRooms || loadingBookings;

  const today = new Date();

  if (loading && rooms.length === 0 && bookings.length === 0) {
    return (
      <div className="py-20 flex justify-center text-[#8a8780]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#c9440f] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-mono">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Detail Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Generate days for the current month
  const daysInMonth = useMemo(() => {
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [currentYear, currentMonth]);

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-500';
      case 'PAID': return 'bg-teal-500';
      case 'ACTIVE': return 'bg-blue-600';
      case 'COMPLETED': return 'bg-purple-600';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'New';
      case 'PAID': return 'Confirmed';
      case 'ACTIVE': return 'Arrived';
      case 'COMPLETED': return 'Checked Out';
      default: return status;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] overflow-hidden overscroll-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200 gap-3">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Rooms:</span>
            <select className="px-2 py-1 border border-gray-300 rounded text-xs bg-white outline-none">
              <option>All</option>
            </select>
          </div>
          
          {/* Mobile Date Display (Short) */}
          <div className="sm:hidden text-sm font-bold text-gray-800">
            {THAI_MONTHS[currentMonth].substring(0, 3)} {currentYear + 543}
          </div>
        </div>

        {/* Desktop Date Display */}
        <div className="hidden sm:block">
          <div className="text-lg font-bold text-gray-800 tracking-tight">
            1 {THAI_MONTHS[currentMonth]} {currentYear + 543} - {daysInMonth.length} {THAI_MONTHS[currentMonth]} {currentYear + 543}
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1 w-full sm:w-auto">
            <button 
              onClick={() => navigateMonth(-1)}
              className="flex-1 sm:flex-none p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all flex justify-center"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={goToToday}
              className="flex-[2] sm:flex-none px-4 py-1 text-[10px] sm:text-xs font-bold text-gray-600 hover:text-orange-600 transition-colors uppercase tracking-wider whitespace-nowrap"
            >
              Today
            </button>
            <button 
              onClick={() => navigateMonth(1)}
              className="flex-1 sm:flex-none p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all flex justify-center"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar Table */}
        <div className="flex flex-col bg-white border-r border-gray-200 z-20 shadow-lg shrink-0 overflow-hidden">
          {/* Header Row */}
          <div className="flex border-b border-gray-200 bg-gray-50 h-10 items-center">
            <div className="w-12 sm:w-20 px-2 sm:px-4 text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase border-r border-gray-200">#</div>
            <div className="hidden sm:block w-24 px-4 text-[11px] font-bold text-gray-500 uppercase border-r border-gray-200">Type</div>
            <div className="w-12 sm:w-24 px-2 sm:px-4 text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase">Stat</div>
          </div>

          {/* Room Rows */}
          <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
            {rooms.map((room) => (
              <div key={room.id} className="flex border-b border-gray-100 group h-[70px] sm:h-[80px] items-center">
                <div className="w-12 sm:w-20 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 border-r border-gray-100">{room.name.replace(/\D/g, '') || room.id}</div>
                <div className="hidden sm:block w-24 px-4 text-xs text-gray-500 border-r border-gray-100">{room.capacity} beds</div>
                <div className="w-12 sm:w-24 px-1 sm:px-4 flex justify-center">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${room.isActive ? 'bg-green-500' : 'bg-red-500'}`} title={room.isActive ? 'Ready' : 'Offline'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="flex-1 overflow-auto bg-white relative no-scrollbar select-none overscroll-none">
          {/* Calendar Header (Days) */}
          <div className="flex sticky top-0 bg-white z-10 border-b border-gray-200 w-max">
            {/* Month Label Row (Desktop Only) */}
            <div className="absolute top-0 left-0 w-full h-4 sm:h-8 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm text-[8px] sm:text-[11px] font-bold text-gray-400 border-b border-gray-100 uppercase tracking-widest">
              {THAI_MONTHS[currentMonth]} {currentYear}
            </div>
            {/* Day Numbers Row */}
            <div className="mt-4 sm:mt-8 flex">
              {daysInMonth.map(day => (
                <div 
                  key={day} 
                  className={`w-10 sm:w-12 h-8 sm:h-10 flex items-center justify-center text-[11px] sm:text-[13px] font-medium border-r border-gray-100 shrink-0
                    ${(new Date(currentYear, currentMonth, day).getDay() === 0 || new Date(currentYear, currentMonth, day).getDay() === 6) ? 'bg-orange-50/30 text-orange-600' : 'text-gray-500'}
                  `}
                >
                  {String(day).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows & Booking Bars */}
          <div className="relative w-max min-w-full">
            {/* Horizontal Background Lines (for room rows) */}
            {rooms.map((room) => (
              <div key={`row-bg-${room.id}`} className="flex border-b border-gray-100 h-[70px] sm:h-[80px]">
                {daysInMonth.map(day => (
                  <div 
                    key={`cell-${room.id}-${day}`} 
                    className={`w-10 sm:w-12 h-full border-r border-gray-50 shrink-0
                      ${(new Date(currentYear, currentMonth, day).getDay() === 0 || new Date(currentYear, currentMonth, day).getDay() === 6) ? 'bg-orange-50/10' : ''}
                    `} 
                  />
                ))}
              </div>
            ))}

            {/* Booking Bars Overlay */}
            <div className="absolute top-0 left-0 pointer-events-none w-full h-full">
              {rooms.map((room, rowIndex) => {
                const roomBookings = bookings.filter(b => b.roomId === room.id && b.status !== 'CANCELLED');
                
                return roomBookings.map(booking => {
                  const checkInDate = new Date(booking.checkIn);
                  const checkOutDate = new Date(booking.checkOut);
                  
                  const monthStart = new Date(currentYear, currentMonth, 1);
                  const monthEnd = new Date(currentYear, currentMonth + 1, 0);

                  if (checkOutDate < monthStart || checkInDate > monthEnd) return null;

                  const startDay = Math.max(1, checkInDate.getMonth() === currentMonth ? checkInDate.getDate() : 1);
                  const endDay = Math.min(daysInMonth.length, checkOutDate.getMonth() === currentMonth ? checkOutDate.getDate() : daysInMonth.length);
                  
                  const dayWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 48;
                  const rowHeight = typeof window !== 'undefined' && window.innerWidth < 640 ? 70 : 80;

                  const width = (endDay - startDay + 1) * dayWidth; 
                  const left = (startDay - 1) * dayWidth;
                  const top = (rowIndex * rowHeight) + 8; // Adjust for row height

                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsDetailModalOpen(true);
                      }}
                      className={`absolute pointer-events-auto cursor-pointer rounded-md sm:rounded-lg shadow-sm border border-black/5 p-1.5 sm:p-3 flex flex-col justify-between overflow-hidden ${getStatusColor(booking.status)}`}
                      style={{ 
                        left: `${left}px`, 
                        top: `${top}px`, 
                        width: `${width - 4}px`,
                        height: typeof window !== 'undefined' && window.innerWidth < 640 ? '54px' : '64px' 
                      }}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[8px] sm:text-[10px] font-bold text-white uppercase truncate">A-{booking.id}</span>
                        <span className="hidden sm:block text-[10px] font-medium text-white/90 whitespace-nowrap">{getStatusLabel(booking.status)}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-[8px] sm:text-[9px] font-bold text-white/90 truncate">
                          {booking.customerName.split(' ')[0]}
                        </div>
                        <div className="flex justify-end mt-0.5">
                          <span className="text-[7px] sm:text-[9px] font-bold text-white/70 italic lowercase">paid</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                });
              })}
            </div>
          </div>
        </div>

      </div>

      <BookingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        booking={selectedBooking}
        roomName={selectedBooking ? rooms.find(r => r.id === selectedBooking.roomId)?.name || '' : ''}
        roomPin={selectedBooking ? rooms.find(r => r.id === selectedBooking.roomId)?.pinLock || null : null}
        onStatusChange={() => {
          setIsDetailModalOpen(false);
        }}
      />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
