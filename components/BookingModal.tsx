'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { backend, BookingStatus, Booking } from '@/lib/supabase';
import useSWR from 'swr';
import { X, CalendarDays, User, Phone, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    roomId?: number;
    checkIn?: string;
    checkOut?: string;
  };
  bookingToEdit?: Booking;
  initialMode?: 'daily' | 'temporary' | 'custom';
}

export default function BookingModal({ isOpen, onClose, onSuccess, initialData, bookingToEdit, initialMode }: BookingModalProps) {
  const { data: rooms = [] } = useSWR('rooms', backend.getRooms);
  const { data: bookings = [] } = useSWR('bookings', backend.getBookings);
  const { data: settingsResponse } = useSWR('/api/settings', (url) => fetch(url).then(res => res.json()));
  const systemSettings = settingsResponse?.data;

  const DEFAULT_DAILY_PRICE = systemSettings?.priceDaily || 500;
  const DEFAULT_TEMPORARY_PRICE = systemSettings?.priceTemporary || 300;

  const [formData, setFormData] = useState({
    customerName: '',
    customerLine: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    status: 'PENDING' as BookingStatus,
    totalPrice: 0 as number | string,
    pinCode: '',
    imageId: '',
  });

  const [priceType] = useState<'room' | 'global_daily' | 'global_temp'>('room');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [bookingMode, setBookingMode] = useState<'daily' | 'temporary' | 'custom'>('daily');

  const getBasePriceByMode = useCallback((roomId: string, mode: 'daily' | 'temporary', type: 'room' | 'global_daily' | 'global_temp') => {
    if (type === 'global_daily') return DEFAULT_DAILY_PRICE;
    if (type === 'global_temp') return DEFAULT_TEMPORARY_PRICE;

    if (mode === 'daily') {
      const selectedRoom = rooms.find(r => r.id === Number(roomId));
      return Number(selectedRoom?.price || DEFAULT_DAILY_PRICE);
    }
    return DEFAULT_TEMPORARY_PRICE;
  }, [rooms, DEFAULT_DAILY_PRICE, DEFAULT_TEMPORARY_PRICE]);

  // Reset or initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSelectedFile(null);
      setBookingMode(initialMode || 'daily');
      if (bookingToEdit) {
        setFormData({
          customerName: bookingToEdit.customerName || '',
          customerLine: bookingToEdit.customerLine || '',
          roomId: String(bookingToEdit.roomId || ''),
          checkIn: bookingToEdit.checkIn ? bookingToEdit.checkIn.split('T')[0] : '',
          checkOut: bookingToEdit.checkOut ? bookingToEdit.checkOut.split('T')[0] : '',
          status: bookingToEdit.status || 'PENDING',
          totalPrice: bookingToEdit.totalPrice || 0,
          pinCode: bookingToEdit.pinCode || '',
          imageId: bookingToEdit.imageId || '',
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        setFormData({
          customerName: '',
          customerLine: '',
          roomId: initialData?.roomId ? String(initialData.roomId) : '',
          checkIn: initialData?.checkIn || today,
          checkOut: initialData?.checkOut || tomorrow.toISOString().split('T')[0],
          status: 'PENDING',
          totalPrice: 500,
          pinCode: '',
          imageId: '',
        });
      }
    }
  }, [isOpen, initialData, bookingToEdit, initialMode]);

  // Handle Booking Mode changes (Daily vs Temporary)
  useEffect(() => {
    if (!isOpen || bookingToEdit) return;

    const basePrice = getBasePriceByMode(formData.roomId, bookingMode === 'custom' ? 'daily' : bookingMode, priceType);

    if (bookingMode === 'custom') {
      // In custom mode, we don't automatically adjust checkOut or totalPrice
      return;
    }

    if (bookingMode === 'temporary') {
      setFormData(prev => ({
        ...prev,
        checkOut: prev.checkIn,
        totalPrice: basePrice
      }));
    } else {
      const inDate = new Date(formData.checkIn || new Date());
      const tomorrow = new Date(inDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        checkOut: tomorrow.toISOString().split('T')[0],
        totalPrice: basePrice
      }));
    }
  }, [bookingMode, isOpen, bookingToEdit, formData.roomId, formData.checkIn, getBasePriceByMode, priceType]);

  // Auto-calculate price if both dates and room are selected (only if NOT in edit mode to avoid overriding custom price)
  useEffect(() => {
    if (formData.checkIn && formData.checkOut && !bookingToEdit && bookingMode === 'daily') {
      const inDate = new Date(formData.checkIn);
      const outDate = new Date(formData.checkOut);
      const diffTime = outDate.getTime() - inDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        const roomDailyPrice = getBasePriceByMode(formData.roomId, 'daily', priceType);
        setFormData(prev => ({ ...prev, totalPrice: diffDays * roomDailyPrice }));
      }
    }
  }, [formData.checkIn, formData.checkOut, bookingMode, formData.roomId, bookingToEdit, getBasePriceByMode, priceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName.trim()) {
      setError('กรุณากรอกชื่อผู้เข้าพัก');
      return;
    }
    if (!formData.roomId) {
      setError('กรุณาเลือกห้องพัก');
      return;
    }

    const isConflict = roomOptions.find(r => r.id === Number(formData.roomId) && !r.isAvailable);
    if (isConflict) {
      setError('ห้องนี้ไม่ว่างในช่วงเวลาที่คุณเลือก กรุณาเปลี่ยนห้องพักหรือเปลี่ยนวันที่เข้าพัก');
      return;
    }

    try {
      setIsLoading(true);
      let finalImageId = formData.imageId;

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.message || 'อัปโหลดรูปภาพล้มเหลว');
        }

        finalImageId = uploadResult.imageId;
        setIsUploading(false);
      }

      const payload = {
        customerName: formData.customerName,
        customerLine: formData.customerLine,
        roomId: Number(formData.roomId),
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        totalPrice: Number(formData.totalPrice),
        pinCode: formData.pinCode || undefined,
        imageId: finalImageId || undefined,
      };

      if (bookingToEdit) {
        await backend.updateBooking(bookingToEdit.id, payload);
      } else {
        await backend.createBooking(payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการจอง';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const calculateNights = (inDate: string, outDate: string) => {
    if (!inDate || !outDate) return 1;
    const d1 = new Date(inDate);
    const d2 = new Date(outDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 0 ? 1 : diffDays;
  };

  // Smart Conflict Detection
  const getAvailableRooms = () => {
    const activeRooms = rooms.filter(r => r.isActive);
    if (!formData.checkIn || !formData.checkOut) {
      return activeRooms.map(r => ({ ...r, isAvailable: true }));
    }

    const inDate = new Date(formData.checkIn).getTime();
    const outDate = new Date(formData.checkOut).getTime();

    return activeRooms.map(room => {
      const overlappingBooking = bookings.find(b => {
        if (b.status === 'CANCELLED') return false;
        if (bookingToEdit && b.id === bookingToEdit.id) return false;
        if (b.roomId !== room.id) return false;

        const bIn = new Date(b.checkIn.split('T')[0]).getTime();
        const bOut = new Date(b.checkOut.split('T')[0]).getTime();

        return inDate < bOut && outDate > bIn;
      });

      return {
        ...room,
        isAvailable: !overlappingBooking
      };
    });
  };

  const roomOptions = getAvailableRooms();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
          className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-3xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e2e0d8] flex items-center justify-between bg-gradient-to-r from-[#f5f4f0] to-white shrink-0">
            <h2 className="text-[18px] font-bold text-[#1a1916] flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#c9440f]/10 text-[#c9440f] flex items-center justify-center">
                {bookingToEdit ? '✏️' : '✨'}
              </span>
              {bookingToEdit ? 'แก้ไขการจอง' : 'สร้างการจองใหม่'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#e2e0d8] text-[#8a8780] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto no-scrollbar flex-1">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-[#fef2f2] border border-[#fee2e2] flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5" />
                  <span className="text-[#dc2626] text-[13px] font-medium leading-relaxed">{error}</span>
                </div>
              )}

              <div className="space-y-5">
                {/* Mode selector has been removed and moved to parent buttons */}

                {/* Guest Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#8a8780] uppercase flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> ชื่อผู้เข้าพัก *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="เช่น สมชาย ใจดี"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e2e0d8] bg-[#fcfbf9] focus:bg-white focus:ring-2 focus:ring-[#c9440f]/20 focus:border-[#c9440f] outline-none transition-all text-[14px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#8a8780] uppercase flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> เบอร์โทร / LINE
                    </label>
                    <input
                      type="text"
                      value={formData.customerLine}
                      onChange={e => setFormData({ ...formData, customerLine: e.target.value })}
                      placeholder="081-xxx-xxxx"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e2e0d8] bg-[#fcfbf9] focus:bg-white focus:ring-2 focus:ring-[#c9440f]/20 focus:border-[#c9440f] outline-none transition-all text-[14px] font-mono"
                    />
                  </div>          
                </div>

                {/* Room & Status */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#8a8780] uppercase">ห้องพัก *</label>
                    <select
                      required
                      value={formData.roomId}
                      onChange={e => {
                        const nextRoomId = e.target.value;
                        const nights = calculateNights(formData.checkIn || '', formData.checkOut || '');
                        const basePrice = getBasePriceByMode(nextRoomId, bookingMode === 'custom' ? 'daily' : bookingMode, priceType);
                        const nextPrice = (!bookingToEdit && bookingMode === 'daily') ? basePrice * nights : (!bookingToEdit && bookingMode !== 'custom' ? basePrice : formData.totalPrice);
                        setFormData({ ...formData, roomId: nextRoomId, totalPrice: nextPrice });
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e2e0d8] bg-[#fcfbf9] focus:bg-white focus:ring-2 focus:ring-[#c9440f]/20 focus:border-[#c9440f] outline-none transition-all text-[14px] font-semibold text-[#1a1916]"
                    >
                      <option value="">-- เลือกห้องพัก --</option>
                      {roomOptions.map(r => (
                        <option key={r.id} value={r.id} disabled={!r.isAvailable}>
                          {r.name} {!r.isAvailable && '(ไม่ว่าง)'}
                        </option>
                      ))}
                    </select>
                    {formData.roomId && roomOptions.find(r => r.id === Number(formData.roomId) && !r.isAvailable) && (
                      <div className="text-[11px] text-[#dc2626] font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" /> ห้องนี้ถูกจองแล้วในช่วงเวลาที่เลือก
                      </div>
                    )}
                  </div>
                  {/* Status was here */}
                </div>

                {/* Dates */}
                <div className="p-4 rounded-2xl bg-[#fafaf8] border border-[#e2e0d8]">
                  <label className="text-[12px] font-bold text-[#8a8780] uppercase mb-3 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> วันเข้าพัก
                  </label>
                  <div className="grid grid-cols-[1.5fr_1fr] gap-3 items-start">
                    <div>
                      <div className="text-[10px] text-[#8a8780] mb-1 font-medium">Check-in</div>
                      <input
                        required
                        type="date"
                        value={formData.checkIn}
                        onChange={e => {
                          const newIn = e.target.value;
                          if (!newIn) {
                            setFormData({ ...formData, checkIn: '' });
                            return;
                          }
                          if (bookingMode === 'custom') {
                            setFormData({ ...formData, checkIn: newIn });
                            return;
                          }
                          const n = calculateNights(formData.checkIn || '', formData.checkOut || '');
                          const newOut = new Date(newIn);
                          if (!isNaN(newOut.getTime())) {
                            newOut.setDate(newOut.getDate() + n);
                            setFormData({ ...formData, checkIn: newIn, checkOut: newOut.toISOString().split('T')[0] });
                          } else {
                            setFormData({ ...formData, checkIn: newIn });
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-[#d0cdc2] bg-white outline-none focus:border-[#c9440f] text-[13px] font-mono font-semibold"
                      />
                    </div>
                    {bookingMode === 'custom' ? (
                      <div>
                        <div className="text-[10px] text-[#8a8780] mb-1 font-medium">Check-out</div>
                        <input
                          required
                          type="date"
                          value={formData.checkOut}
                          onChange={e => setFormData({ ...formData, checkOut: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#d0cdc2] bg-white outline-none focus:border-[#c9440f] text-[13px] font-mono font-semibold"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-[10px] text-[#8a8780] mb-1 font-medium flex items-center justify-between">
                          จำนวนคืน
                          <span className="text-[9px] text-[#c9440f] block mt-0.5 sm:inline sm:mt-0 sm:ml-1">(ออก: {formData.checkOut && !isNaN(new Date(formData.checkOut).getTime()) ? new Date(formData.checkOut).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : '—'})</span>
                        </div>
                        <input
                          required
                          type="number"
                          min="1"
                          value={bookingMode === 'temporary' && !bookingToEdit ? 0 : calculateNights(formData.checkIn || '', formData.checkOut || '')}
                          onChange={e => {
                            const n = parseInt(e.target.value) || 1;
                            if (!formData.checkIn) return;
                            const newOut = new Date(formData.checkIn);
                            if (!isNaN(newOut.getTime())) {
                              newOut.setDate(newOut.getDate() + n);
                              const basePrice = getBasePriceByMode(formData.roomId, 'daily', priceType);
                              const newPrice = (!bookingToEdit && bookingMode === 'daily') ? basePrice * n : formData.totalPrice;
                              setFormData({ ...formData, checkOut: newOut.toISOString().split('T')[0], totalPrice: newPrice });
                            }
                          }}
                          disabled={bookingMode === 'temporary' && !bookingToEdit}
                          className={`w-full px-3 py-2 rounded-lg border border-[#d0cdc2] outline-none text-[13px] font-mono font-semibold ${bookingMode === 'temporary' && !bookingToEdit ? 'bg-[#f5f4f0] text-[#8a8780] cursor-not-allowed' : 'bg-white focus:border-[#c9440f]'}`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & PIN */}
                <div className="space-y-4">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1a1916] text-white">
                      <div className="text-[13px] font-medium text-white/80">ยอดสุทธิ</div>
                      <div className="flex items-center gap-1">
                        <span className="text-white/50 font-bold text-[14px]">฿</span>
                        <input
                          type="number"
                          value={formData.totalPrice}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData({ ...formData, totalPrice: val === '' ? '' : Number(val) });
                          }}
                          className="w-24 bg-transparent text-right outline-none text-[20px] font-mono font-bold text-[#e88c2a]"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#e2e0d8] flex flex-col justify-center">
                      <label className="text-[10px] font-bold text-[#8a8780] uppercase mb-1">รหัส PIN (ตัวเลือก)</label>
                      <input
                        type="text"
                        value={formData.pinCode}
                        onChange={e => setFormData({ ...formData, pinCode: e.target.value })}
                        placeholder="เช่น 123456"
                        className="w-full bg-transparent outline-none text-[16px] font-mono font-bold text-[#1a1916]"
                      />
                    </div>
                  </div>
                </div>
                 <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#8a8780] uppercase flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> รูปบัตรประชาชน {(formData.imageId || selectedFile) && <span className="text-green-500 text-[10px] normal-case">({formData.imageId ? 'อัปโหลดแล้ว' : 'เลือกแล้ว'})</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isLoading}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#e2e0d8] bg-[#fcfbf9] focus:bg-white focus:ring-2 focus:ring-[#c9440f]/20 focus:border-[#c9440f] outline-none transition-all text-[14px] font-mono disabled:opacity-50"
                      />
                    </div>
                    {(formData.imageId || selectedFile) && (
                      <p className="text-[11px] text-[#8a8780] mt-1 truncate">
                        ไฟล์: {selectedFile ? selectedFile.name : formData.imageId}
                      </p>
                    )}
                  </div>  
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-[#e2e0d8] bg-white shrink-0 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl border border-[#e2e0d8] text-[#8a8780] font-bold text-[14px] hover:bg-[#fafaf8] transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-[2] py-3.5 rounded-xl bg-[#c9440f] text-white font-bold text-[14px] hover:bg-[#b03b0d] transition-all active:scale-[0.98] shadow-lg shadow-[#c9440f]/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isUploading ? 'กำลังอัปโหลดรูปภาพ...' : 'กำลังบันทึก...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> ยืนยันการจอง
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
