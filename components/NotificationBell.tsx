'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Clock, AlertCircle } from 'lucide-react';
import useSWR from 'swr';
import { backend } from '@/lib/supabase';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastNotified, setLastNotified] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem('last_notified_bookings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing last notified:', e);
      }
    }
    return {};
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [] } = useSWR('rooms', backend.getRooms);
  const { data: bookings = [] } = useSWR('bookings', backend.getBookings, { refreshInterval: 60000 }); // Refresh every 1 min

  const getRoomName = useCallback((roomId: number) => rooms.find(r => r.id === roomId)?.name || `Room ${roomId}`, [rooms]);

  const attentionBookings = bookings.filter(b => {
    const now = new Date();
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);

    // 1. Should have checked in (PAID but past check-in time)
    if (b.status === 'PAID' && now > checkIn) return true;

    // 2. Should be checking out (ACTIVE but past check-out time)
    if (b.status === 'ACTIVE' && now > checkOut) return true;

    return false;
  }).sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

  // Handle LINE OA notification
  useEffect(() => {
    const checkAndNotify = async () => {
      const now = Date.now();
      const newNotified = { ...lastNotified };
      let updated = false;

      for (const b of attentionBookings) {
        const key = `${b.id}_${b.status}`;
        // Notify if not notified in the last 1 hour for the same status
        if (!lastNotified[key] || now - lastNotified[key] > 3600000) {
          const roomName = getRoomName(b.roomId);
          let message = '';

          if (b.status === 'PAID') {
            message = `\n[แจ้งเตือนเช็คอิน]\nห้อง: ${roomName}\nลูกค้า: ${b.customerName}\nเลยเวลาเช็คอินแล้ว!`;
          } else if (b.status === 'ACTIVE') {
            message = `\n[แจ้งเตือนเช็คเอาท์]\nห้อง: ${roomName}\nลูกค้า: ${b.customerName}\nเลยเวลาเช็คเอาท์แล้ว!`;
          }

          if (message) {
            try {
              await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
              });
              newNotified[key] = now;
              updated = true;
            } catch (err) {
              console.error('Failed to send LINE OA notification:', err);
            }
          }
        }
      }

      if (updated) {
        setLastNotified(newNotified);
        localStorage.setItem('last_notified_bookings', JSON.stringify(newNotified));
      }
    };

    if (attentionBookings.length > 0) {
      checkAndNotify();
    }
  }, [attentionBookings, rooms, lastNotified, getRoomName]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {attentionBookings.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {attentionBookings.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-[14px] font-bold text-gray-800">การแจ้งเตือน</h3>
            <span className="text-[11px] text-gray-500 font-medium">ต้องการการดูแล {attentionBookings.length} รายการ</span>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {attentionBookings.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[13px] text-gray-400">ไม่มีการแจ้งเตือนใหม่</p>
              </div>
            ) : (
              attentionBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 p-2 rounded-lg ${b.status === 'PAID' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {b.status === 'PAID' ? <Clock className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-[13px] font-bold text-gray-800">{getRoomName(b.roomId)}</p>
                        <span className="text-[10px] font-medium text-gray-400">
                          {b.status === 'PAID' ? 'เลยเวลาเข้าพัก' : 'เลยเวลาเช็คเอาท์'}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-600 mt-0.5">{b.customerName}</p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 bg-gray-100 w-fit px-1.5 py-0.5 rounded">
                        <Clock className="w-3 h-3" />
                        {new Date(b.status === 'PAID' ? b.checkIn : b.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {attentionBookings.length > 0 && (
            <div className="p-3 bg-gray-50 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-[12px] text-gray-500 hover:text-gray-800 font-medium"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
