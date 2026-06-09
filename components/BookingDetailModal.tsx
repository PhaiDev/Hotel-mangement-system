'use client';

import React, { useState } from 'react';
import { Booking, BookingStatus, backend } from '@/lib/supabase';
import { X, User, Phone, MapPin, CalendarDays, KeyRound, CreditCard, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  roomName: string;
  roomPin: string | null;
  onStatusChange: () => void;
}

export default function BookingDetailModal({ isOpen, onClose, booking, roomName, roomPin, onStatusChange }: BookingDetailModalProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  if (!isOpen || !booking) return null;

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

  const statusColors = {
    'PENDING': { bg: 'bg-[#fdf8e7]', text: 'text-[#b58a00]', border: 'border-[#fdf3d0]', label: '⏳ รอชำระเงิน' },
    'PAID': { bg: 'bg-[#eaf0fb]', text: 'text-[#1a4fa0]', border: 'border-[#e2eaf8]', label: '฿ ชำระแล้ว' },
    'ACTIVE': { bg: 'bg-[#eaf5ef]', text: 'text-[#1a7a4a]', border: 'border-[#dcf0e5]', label: '🏠 เข้าพัก' },
    'COMPLETED': { bg: 'bg-[#eaf5ef]', text: 'text-[#1a7a4a]', border: 'border-[#dcf0e5]', label: '✓ เช็คเอาท์' },
    'CANCELLED': { bg: 'bg-[#fafaf8]', text: 'text-[#8a8780]', border: 'border-[#e2e0d8]', label: '✕ ยกเลิก' },
  };

  const currentStatus = statusColors[booking.status] || statusColors['PENDING'];

  const handleStatusChange = async (newStatus: BookingStatus) => {
    try {
      await backend.updateBookingStatus(booking.id, newStatus);
      setIsChangingStatus(false);
      onStatusChange(); // trigger refresh
    } catch (err) {
      console.error(err);
      alert('เปลี่ยนสถานะล้มเหลว');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[440px] bg-white rounded-[24px] sm:rounded-3xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e2e0d8] flex items-center justify-between bg-gradient-to-r from-[#f5f4f0] to-white shrink-0">
            <h2 className="text-[16px] font-bold text-[#1a1916] flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#1a4fa0]/10 text-[#1a4fa0] flex items-center justify-center">📋</span>
              รายละเอียดการจอง
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#e2e0d8] text-[#8a8780] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto no-scrollbar flex-1">
            
            {/* Guest Info */}
            <div className="mb-5">
              <div className="text-[11px] font-bold text-[#8a8780] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> ข้อมูลผู้เข้าพัก
              </div>
              <div className="border border-[#e2e0d8] rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="px-4 py-3 border-b border-[#e2e0d8] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f5f4f0] flex items-center justify-center shrink-0">👤</div>
                  <div>
                    <div className="text-[10px] text-[#8a8780] mb-0.5">ชื่อ-นามสกุล</div>
                    <div className="font-bold text-[14px] text-[#1a1916]">{booking.customerName || '—'}</div>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f5f4f0] flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-[#8a8780]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8a8780] mb-0.5">เบอร์โทร / LINE ID</div>
                    <div className="font-bold font-mono text-[13px] text-[#1a1916]">{booking.customerLine || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="mb-5">
              <div className="text-[11px] font-bold text-[#8a8780] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> รายละเอียดการเข้าพัก
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#e2e0d8] rounded-2xl px-4 py-3 bg-[#fafaf8] shadow-sm">
                  <div className="text-[10px] text-[#8a8780] mb-1">ห้องพัก</div>
                  <div className="font-bold text-[16px] text-[#1a1916] leading-tight flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#c9440f]" /> {roomName}
                  </div>
                </div>
                <div className="border border-[#e2e0d8] rounded-2xl px-4 py-3 bg-[#fafaf8] shadow-sm">
                  <div className="text-[10px] text-[#8a8780] mb-1">วันที่</div>
                  <div className="font-bold font-mono text-[13px] text-[#1a1916]">{formatDate(booking.checkIn)}</div>
                  <div className="text-[10px] text-[#8a8780]">ถึง {formatDate(booking.checkOut)}</div>
                </div>
              </div>
            </div>

            {/* Status & PIN */}
            <div className="mb-6 grid grid-cols-2 gap-3 relative">
              <div className="border border-[#e2e0d8] rounded-2xl p-3 bg-white shadow-sm relative">
                <div className="text-[10px] text-[#8a8780] mb-1">สถานะ</div>
                <button 
                  onClick={() => setIsChangingStatus(!isChangingStatus)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border ${currentStatus.border} ${currentStatus.bg} ${currentStatus.text} font-mono font-bold text-[12px] flex items-center justify-between transition-colors hover:brightness-95`}
                >
                  {currentStatus.label}
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </button>
                
                {/* Status Dropdown */}
                <AnimatePresence>
                  {isChangingStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-1 w-[200px] bg-white border border-[#e2e0d8] shadow-xl rounded-xl z-10 overflow-hidden"
                    >
                      {(Object.keys(statusColors) as BookingStatus[]).map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={`w-full text-left px-4 py-2.5 text-[12px] font-mono font-bold transition-colors hover:bg-[#fafaf8] ${booking.status === s ? 'bg-[#f5f4f0]' : ''} ${statusColors[s].text}`}
                        >
                          {statusColors[s].label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border border-[#e2e0d8] rounded-2xl p-3 bg-white shadow-sm">
                <div className="text-[10px] text-[#8a8780] mb-1">รหัส PIN (ประตู)</div>
                <div className="font-bold font-mono text-[14px] text-[#1a1916] flex items-center gap-1.5 px-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#e88c2a]" /> {booking.pinCode || roomPin || '—'}
                </div>
              </div>
            </div>

            {/* ID Card Image */}
            {booking.imageId && (
              <div className="mb-5">
                <div className="text-[11px] font-bold text-[#8a8780] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> รูปบัตรประชาชน
                </div>
                <div className="border border-[#e2e0d8] rounded-2xl overflow-hidden bg-white shadow-sm p-1">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/id_card/${booking.imageId}`}
                    alt="ID Card"
                    className="w-full h-auto rounded-xl object-cover max-h-[200px]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Image+Access+Restricted';
                    }}
                  />
                  <div className="px-2 py-1.5 text-[10px] text-[#8a8780] truncate text-center">
                    ไฟล์: {booking.imageId}
                  </div>
                </div>
              </div>
            )}

            {/* Total Price */}
            <div className="bg-[#1a1916] rounded-2xl p-5 flex items-center justify-between text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9440f] opacity-20 blur-[40px] rounded-full translate-x-10 -translate-y-10" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white/90" />
                </div>
                <span className="text-[14px] font-medium text-white/90">ยอดสุทธิ<br/><span className="text-[10px] text-white/50 uppercase">Total Price</span></span>
              </div>
              <div className="relative font-mono text-[28px] font-bold text-[#e88c2a]">
                <span className="text-[16px] text-white/40 mr-1">฿</span>
                {Number(booking.totalPrice || 0).toLocaleString()}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
