'use client';

import React, { useState, useEffect } from 'react';
import { backend, Room, Booking } from '@/lib/supabase';
import { SwalStyled, swalCSS } from '@/lib/swalTheme';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Pencil, Trash2, Plus, RefreshCw, Key, Users, Lock, Power } from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
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
    fetchRooms();
    const style = document.createElement('style');
    style.textContent = swalCSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const isRoomOccupied = (roomId: number) => {
    return bookings.some(b => b.roomId === roomId && b.status === 'ACTIVE');
  };
  
  const getActiveBookingForRoom = (roomId: number) => {
    return bookings.find(b => b.roomId === roomId && b.status === 'ACTIVE');
  };

  const onToggleRoomActive = async (roomId: number, currentActive: boolean) => {
    const action = currentActive ? 'ระงับ' : 'เปิด';
    const result = await SwalStyled.fire({
      title: `${currentActive ? '⏸️' : '▶️'} ${action}ให้บริการ?`,
      html: `<div style="font-size:13px;">คุณต้องการ<strong>${action}</strong>ห้องพักนี้หรือไม่?</div>`,
      showCancelButton: true,
      confirmButtonText: `${action}เลย`,
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        await backend.updateRoomActiveState(roomId, !currentActive);
        SwalStyled.fire({ icon: 'success', title: `${action}สำเร็จ!`, timer: 1500, showConfirmButton: false });
        fetchRooms();
      } catch (err: any) {
        SwalStyled.fire('ล้มเหลว', err.message, 'error');
      }
    }
  };

  // ===== EDIT PIN =====
  const onEditPin = async (bookingId: number, currentPin?: string) => {
    const { value: newPin } = await SwalStyled.fire({
      title: '🔑 แก้ไขรหัส PIN',
      html: '<div style="font-size:13px; color:rgba(240,236,232,0.5);">กรุณากรอกรหัส PIN สำหรับล็อคประตู</div>',
      input: 'text',
      inputValue: currentPin || '',
      inputPlaceholder: 'เช่น 1234',
      showCancelButton: true,
      confirmButtonText: '💾 บันทึก',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (value) => {
        if (!value) return 'กรุณากรอกรหัส PIN';
        return null;
      },
    });

    if (newPin) {
      try {
        await backend.updateBookingPin(bookingId, newPin);
        SwalStyled.fire({ icon: 'success', title: 'อัปเดต PIN สำเร็จ!', timer: 1500, showConfirmButton: false });
        fetchRooms();
      } catch (err: any) {
        SwalStyled.fire('ล้มเหลว', err.message, 'error');
      }
    }
  };

  // ===== EDIT ROOM =====
  const onEditRoom = async (room: Room) => {
    const { value: formValues } = await SwalStyled.fire({
      title: '✏️ แก้ไขห้องพัก',
      html: `
        <div style="text-align:left;">
          <label class="swal-form-label">ชื่อห้อง</label>
          <input id="swal-name" class="swal-form-input" value="${room.name}" placeholder="เช่น Room 101">

          <div class="swal-form-row">
            <div>
              <label class="swal-form-label">ความจุ (ท่าน)</label>
              <input id="swal-capacity" type="number" class="swal-form-input" value="${room.capacity}" min="1">
            </div>
            <div>
              <label class="swal-form-label">Lock ID</label>
              <input id="swal-lock" class="swal-form-input" value="${room.lockId || ''}" placeholder="อุปกรณ์ล็อค">
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '💾 บันทึก',
      cancelButtonText: 'ยกเลิก',
      width: 460,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        if (!name.trim()) {
          Swal.showValidationMessage('กรุณากรอกชื่อห้อง');
          return false;
        }
        return {
          name,
          capacity: Number((document.getElementById('swal-capacity') as HTMLInputElement).value) || 1,
          lockId: (document.getElementById('swal-lock') as HTMLInputElement).value,
        };
      },
    });

    if (formValues) {
      try {
        await backend.updateRoom(room.id, formValues);
        SwalStyled.fire({ icon: 'success', title: 'อัปเดตสำเร็จ!', timer: 1500, showConfirmButton: false });
        fetchRooms();
      } catch (err: any) {
        SwalStyled.fire('ล้มเหลว', err.message, 'error');
      }
    }
  };

  // ===== CREATE ROOM =====
  const onCreateRoom = async () => {
    const { value: formValues } = await SwalStyled.fire({
      title: '🏨 เพิ่มห้องพักใหม่',
      html: `
        <div style="text-align:left;">
          <label class="swal-form-label">ชื่อห้อง *</label>
          <input id="swal-name" class="swal-form-input" placeholder="เช่น Room 201">

          <div class="swal-form-row">
            <div>
              <label class="swal-form-label">ความจุ (ท่าน)</label>
              <input id="swal-capacity" type="number" class="swal-form-input" value="2" min="1">
            </div>
            <div>
              <label class="swal-form-label">Lock ID</label>
              <input id="swal-lock" class="swal-form-input" placeholder="อุปกรณ์ล็อค">
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '✨ สร้างห้อง',
      cancelButtonText: 'ยกเลิก',
      width: 460,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        if (!name.trim()) {
          Swal.showValidationMessage('กรุณากรอกชื่อห้อง');
          return false;
        }
        return {
          name,
          capacity: Number((document.getElementById('swal-capacity') as HTMLInputElement).value) || 2,
          lockId: (document.getElementById('swal-lock') as HTMLInputElement).value || '',
          isActive: true,
        };
      },
    });

    if (formValues) {
      try {
        await backend.createRoom(formValues);
        SwalStyled.fire({ icon: 'success', title: 'สร้างสำเร็จ!', text: 'เพิ่มห้องพักใหม่เรียบร้อยแล้ว', timer: 1800, showConfirmButton: false });
        fetchRooms();
      } catch (err: any) {
        SwalStyled.fire('ล้มเหลว', err.message, 'error');
      }
    }
  };

  // ===== DELETE ROOM =====
  const onDeleteRoom = async (room: Room) => {
    if (isRoomOccupied(room.id)) {
      SwalStyled.fire({
        title: '⚠️ ไม่สามารถลบได้',
        html: '<div style="font-size:13px;">ห้องนี้ยังมีผู้เข้าพักอยู่ กรุณาเช็คเอาท์ก่อน</div>',
        icon: 'warning',
      });
      return;
    }

    const result = await SwalStyled.fire({
      title: '🗑️ ลบห้องพัก?',
      html: `<div style="font-size:13px;">คุณต้องการลบ <strong>${room.name}</strong> หรือไม่?<br/><span style="color:#f87060; font-size:11px;">การกระทำนี้ไม่สามารถย้อนกลับได้</span></div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ ลบเลย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
    });

    if (result.isConfirmed) {
      try {
        await backend.deleteRoom(room.id);
        SwalStyled.fire({ icon: 'success', title: 'ลบสำเร็จ!', timer: 1500, showConfirmButton: false });
        fetchRooms();
      } catch (err: any) {
        SwalStyled.fire('ล้มเหลว', err.message, 'error');
      }
    }
  };

  if (loading) return (
    <div className="py-20 flex justify-center text-[#8a8780]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#c9440f] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] font-mono">กำลังโหลดข้อมูลห้องพัก...</span>
      </div>
    </div>
  );

  const occupiedCount = rooms.filter(r => isRoomOccupied(r.id)).length;
  const availableCount = rooms.filter(r => r.isActive && !isRoomOccupied(r.id)).length;
  const inactiveCount = rooms.filter(r => !r.isActive).length;

  return (
    <div className="animate-in fade-in duration-300">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-4 text-center">
          <div className="font-mono text-[24px] font-medium">{rooms.length}</div>
          <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.6px]">ทั้งหมด</div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-4 text-center">
          <div className="font-mono text-[24px] font-medium text-[#1a7a4a]">{availableCount}</div>
          <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.6px]">ว่าง</div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-4 text-center">
          <div className="font-mono text-[24px] font-medium text-[#c9440f]">{occupiedCount}</div>
          <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.6px]">มีผู้พัก</div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-4 text-center">
          <div className="font-mono text-[24px] font-medium text-[#8a8780]">{inactiveCount}</div>
          <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.6px]">ระงับ</div>
        </div>
      </div>

      <div className="bg-white border border-[#e2e0d8] rounded-lg mb-5 shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[#e2e0d8] flex items-center justify-between">
          <div className="text-[13px] font-semibold tracking-[0.3px]">ห้องพักทั้งหมด</div>
          <div className="flex items-center gap-2">
            <button onClick={fetchRooms} className="p-1.5 rounded-md border border-[#d0cdc2] text-[#8a8780] hover:bg-[#f5f4f0] transition-colors" title="รีเฟรช">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onCreateRoom} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#c9440f] text-white text-[12px] font-medium hover:bg-[#e04d12] transition-colors">
              <Plus className="w-3.5 h-3.5" /> เพิ่มห้อง
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
          {rooms.map((r) => {
            const isOccupied = isRoomOccupied(r.id);
            const activeBooking = getActiveBookingForRoom(r.id);
            const isAvailable = !isOccupied && r.isActive;
            
            return (
              <div key={r.id} className={`border rounded-lg p-4 transition-all hover:shadow-md group bg-white ${
                isOccupied ? 'border-l-[3px] border-l-[#c9440f] border-[#e2e0d8]' : 
                isAvailable ? 'border-l-[3px] border-l-[#1a7a4a] border-[#e2e0d8]' : 'border-l-[3px] border-l-[#8a8780] border-[#e2e0d8] opacity-70'
              }`}>
                {/* Room Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-mono text-[18px] font-medium">{r.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8a8780]">
                        <Users className="w-3 h-3" /> {r.capacity} ท่าน
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8a8780]">
                        <Lock className="w-3 h-3" /> {r.lockId || '-'}
                      </span>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditRoom(r)} className="p-1.5 rounded-md hover:bg-[#fdf8e7] text-[#b58a00] transition-colors" title="แก้ไข">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDeleteRoom(r)} className="p-1.5 rounded-md hover:bg-[#fef2f2] text-[#dc2626] transition-colors" title="ลบ">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                {/* Status */}
                <div className={`text-[11px] font-medium mb-1 ${isOccupied ? 'text-[#c9440f]' : isAvailable ? 'text-[#1a7a4a]' : 'text-neutral-500'}`}>
                  {isOccupied ? `● มีผู้พัก (${activeBooking?.customerName})` : isAvailable ? '● ว่าง' : `● ระงับให้บริการ`}
                </div>
                
                {/* PIN */}
                {isOccupied && (
                  <div 
                    onClick={() => activeBooking && onEditPin(activeBooking.id, activeBooking.pinCode)}
                    className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[#8a8780] mt-1 cursor-pointer hover:text-[#1a4fa0] transition-colors bg-[#fafaf8] px-2.5 py-1 rounded-md border border-[#e2e0d8]"
                  >
                    <Key className="w-3 h-3" />
                    {activeBooking?.pinCode ? `PIN: ${activeBooking.pinCode}` : 'ตั้ง PIN'}
                  </div>
                )}
                
                {/* Actions Footer */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#e2e0d8]">
                  <button  
                    onClick={() => onToggleRoomActive(r.id, r.isActive)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] transition-colors ${
                      r.isActive 
                      ? 'border-[#1a7a4a]/20 bg-[#eaf5ef] text-[#1a7a4a] hover:bg-[#d4ede1]' 
                      : 'border-[#d0cdc2] bg-white text-[#8a8780] hover:bg-[#f5f4f0]'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {r.isActive ? 'เปิดอยู่' : 'ปิดอยู่'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
