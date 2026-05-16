'use client';

import React, { useEffect } from 'react';
import { backend, Room, Booking } from '@/lib/supabase';
import { SwalStyled, swalCSS } from '@/lib/swalTheme';
import Swal from 'sweetalert2';

import { Pencil, Trash2, Plus, RefreshCw, Key, Users, Lock, Power, LogOut, Info } from 'lucide-react';
import useSWR from 'swr';


const ROOM_IMAGE_FALLBACK = '/mock_room.png';

const escapeHtml = (value: string = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export default function RoomsPage() {
  const { data: rooms = [], mutate: mutateRooms, isLoading: loadingRooms } = useSWR('rooms', backend.getRooms, { revalidateOnFocus: true });
  const { data: bookings = [], mutate: mutateBookings, isLoading: loadingBookings } = useSWR('bookings', backend.getBookings, { revalidateOnFocus: true });
  const loading = loadingRooms || loadingBookings;

  const fetchRooms = async () => {
    await Promise.all([mutateRooms(), mutateBookings()]);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = swalCSS;
    document.head.appendChild(style);
    return () => { if (document.head.contains(style)) document.head.removeChild(style); };
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
      } catch (err: unknown) {
        SwalStyled.fire('ล้มเหลว', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error');
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
      } catch (err: unknown) {
        SwalStyled.fire('ล้มเหลว', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error');
      }
    }
  };

  // ===== EDIT ROOM =====
  const onEditRoom = async (room: Room) => {
    const bindRoomPreview = () => {
      const imageInput = document.getElementById('swal-imageUrl') as HTMLInputElement | null;
      const nameInput = document.getElementById('swal-name') as HTMLInputElement | null;
      const previewImage = document.getElementById('swal-room-preview') as HTMLImageElement | null;
      const previewName = document.getElementById('swal-room-preview-name');
      if (!imageInput || !nameInput || !previewImage || !previewName) return;

      const syncImage = () => {
        previewImage.src = imageInput.value.trim() || ROOM_IMAGE_FALLBACK;
      };
      const syncName = () => {
        previewName.textContent = nameInput.value.trim() || 'ชื่อห้อง';
      };
      imageInput.addEventListener('input', syncImage);
      nameInput.addEventListener('input', syncName);
    };

    const { value: formValues } = await SwalStyled.fire({
      title: '✏️ แก้ไขห้องพัก',
      html: `
        <div class="room-form-layout">
          <div class="room-form-panel">
            <label class="swal-form-label">ชื่อห้อง *</label>
            <input id="swal-name" class="swal-form-input" value="${escapeHtml(room.name)}" placeholder="เช่น Room 101">

            <label class="swal-form-label">รหัสล็อคเกอร์ (Locker Box)</label>
            <input id="swal-pinLock" class="swal-form-input" value="${escapeHtml(room.pinLock || '')}" placeholder="เช่น 1234">

            <div class="swal-form-row">
              <div>
                <label class="swal-form-label">ความจุ (ท่าน)</label>
                <input id="swal-capacity" type="number" class="swal-form-input" value="${room.capacity}" min="1">
              </div>
              <div>
                <label class="swal-form-label">ราคาต่อคืน (บาท)</label>
                <input id="swal-price" type="number" class="swal-form-input" value="${Number(room.price || 0)}" min="0">
              </div>
            </div>

            <div class="swal-form-row">
              <div>
                <label class="swal-form-label">Lock ID</label>
                <input id="swal-lock" class="swal-form-input" value="${escapeHtml(room.lockId || '')}" placeholder="อุปกรณ์ล็อค">
              </div>
              <div></div>
            </div>

            <label class="swal-form-label">ลิงก์รูปภาพห้อง (Image URL)</label>
            <input id="swal-imageUrl" class="swal-form-input" value="${escapeHtml(room.imageUrl || '')}" placeholder="https://... หรือปล่อยว่าง">
          </div>

          <div class="room-preview-panel">
            <div class="room-preview-card">
              <img
                id="swal-room-preview"
                class="room-preview-image"
                src="${escapeHtml(room.imageUrl || ROOM_IMAGE_FALLBACK)}"
                alt="room preview"
                onerror="this.src='${ROOM_IMAGE_FALLBACK}'"
              />
              <div class="room-preview-overlay">
                <div id="swal-room-preview-name" class="room-preview-title">${escapeHtml(room.name)}</div>
              </div>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการบันทึก',
      cancelButtonText: 'ยกเลิก',
      width: 640,
      customClass: {
        popup: 'sumotel-room-popup',
        title: 'sumotel-room-title',
        htmlContainer: 'sumotel-room-html',
        actions: 'sumotel-room-actions',
        confirmButton: 'sumotel-room-confirm',
        cancelButton: 'sumotel-room-cancel',
      },
      didOpen: bindRoomPreview,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        if (!name.trim()) {
          Swal.showValidationMessage('กรุณากรอกชื่อห้อง');
          return false;
        }
        return {
          name,
          pinLock: (document.getElementById('swal-pinLock') as HTMLInputElement).value,
          capacity: Number((document.getElementById('swal-capacity') as HTMLInputElement).value) || 1,
          price: Number((document.getElementById('swal-price') as HTMLInputElement).value) || 0,
          lockId: (document.getElementById('swal-lock') as HTMLInputElement).value,
          imageUrl: (document.getElementById('swal-imageUrl') as HTMLInputElement).value,
        };
      },
    });

    if (formValues) {
      try {
        await backend.updateRoom(room.id, formValues);
        SwalStyled.fire({ icon: 'success', title: 'อัปเดตสำเร็จ!', timer: 1500, showConfirmButton: false });
        fetchRooms();
      } catch (err: unknown) {
        SwalStyled.fire('ล้มเหลว', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error');
      }
    }
  };

  // ===== CREATE ROOM =====
  const onCreateRoom = async () => {
    const bindRoomPreview = () => {
      const imageInput = document.getElementById('swal-imageUrl') as HTMLInputElement | null;
      const nameInput = document.getElementById('swal-name') as HTMLInputElement | null;
      const previewImage = document.getElementById('swal-room-preview') as HTMLImageElement | null;
      const previewName = document.getElementById('swal-room-preview-name');
      if (!imageInput || !nameInput || !previewImage || !previewName) return;

      const syncImage = () => {
        previewImage.src = imageInput.value.trim() || ROOM_IMAGE_FALLBACK;
      };
      const syncName = () => {
        previewName.textContent = nameInput.value.trim() || 'ชื่อห้อง';
      };
      imageInput.addEventListener('input', syncImage);
      nameInput.addEventListener('input', syncName);
    };

    const { value: formValues } = await SwalStyled.fire({
      title: '🏨 เพิ่มห้องพักใหม่',
      html: `
        <div class="room-form-layout">
          <div class="room-form-panel">
            <label class="swal-form-label">ชื่อห้อง *</label>
            <input id="swal-name" class="swal-form-input" placeholder="เช่น Room 201">

            <label class="swal-form-label">รหัสล็อคเกอร์ (Locker Box)</label>
            <input id="swal-pinLock" class="swal-form-input" placeholder="เช่น 1234">

            <div class="swal-form-row">
              <div>
                <label class="swal-form-label">ความจุ (ท่าน)</label>
                <input id="swal-capacity" type="number" class="swal-form-input" value="2" min="1">
              </div>
              <div>
                <label class="swal-form-label">ราคาต่อคืน (บาท)</label>
                <input id="swal-price" type="number" class="swal-form-input" value="0" min="0">
              </div>
            </div>

            <div class="swal-form-row">
              <div>
                <label class="swal-form-label">Lock ID</label>
                <input id="swal-lock" class="swal-form-input" placeholder="อุปกรณ์ล็อค">
              </div>
              <div></div>
            </div>

            <label class="swal-form-label">ลิงก์รูปภาพห้อง (Image URL)</label>
            <input id="swal-imageUrl" class="swal-form-input" placeholder="https://... หรือปล่อยว่าง">
          </div>

          <div class="room-preview-panel">
            <div class="room-preview-card">
              <img
                id="swal-room-preview"
                class="room-preview-image"
                src="${ROOM_IMAGE_FALLBACK}"
                alt="room preview"
                onerror="this.src='${ROOM_IMAGE_FALLBACK}'"
              />
              <div class="room-preview-overlay">
                <div id="swal-room-preview-name" class="room-preview-title">ชื่อห้อง</div>
              </div>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการสร้าง',
      cancelButtonText: 'ยกเลิก',
      width: 640,
      customClass: {
        popup: 'sumotel-room-popup',
        title: 'sumotel-room-title',
        htmlContainer: 'sumotel-room-html',
        actions: 'sumotel-room-actions',
        confirmButton: 'sumotel-room-confirm',
        cancelButton: 'sumotel-room-cancel',
      },
      didOpen: bindRoomPreview,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        if (!name.trim()) {
          Swal.showValidationMessage('กรุณากรอกชื่อห้อง');
          return false;
        }
        return {
          name,
          pinLock: (document.getElementById('swal-pinLock') as HTMLInputElement).value || '',
          capacity: Number((document.getElementById('swal-capacity') as HTMLInputElement).value) || 2,
          price: Number((document.getElementById('swal-price') as HTMLInputElement).value) || 0,
          lockId: (document.getElementById('swal-lock') as HTMLInputElement).value || '',
          imageUrl: (document.getElementById('swal-imageUrl') as HTMLInputElement).value || '',
          isActive: true,
        };
      },
    });

    if (formValues) {
      try {
        await backend.createRoom(formValues);
        SwalStyled.fire({ icon: 'success', title: 'สร้างสำเร็จ!', text: 'เพิ่มห้องพักใหม่เรียบร้อยแล้ว', timer: 1800, showConfirmButton: false });
        fetchRooms();
      } catch (err: unknown) {
        SwalStyled.fire('ล้มเหลว', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error');
      }
    }
  };


  // ===== QUICK CHECKOUT =====
  const onCheckOut = async (booking: Booking) => {
    const result = await SwalStyled.fire({
      title: '📤 ยืนยันการเช็คเอาท์?',
      html: `<div style="font-size:13px;">ยืนยันการเช็คเอาท์ <strong>${booking.customerName}</strong> ใช่หรือไม่?</div>`,
      showCancelButton: true,
      confirmButtonText: 'เช็คเอาท์เลย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#c9440f',
    });

    if (result.isConfirmed) {
      try {
        await backend.updateBookingStatus(booking.id, 'COMPLETED');
        SwalStyled.fire({ icon: 'success', title: 'เช็คเอาท์สำเร็จ!', timer: 1500, showConfirmButton: false });
        fetchRooms();
      } catch (err: unknown) {
        SwalStyled.fire('ล้มเหลว', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error');
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
      } catch (err: unknown) {
        SwalStyled.fire('ล้มเหลว', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error');
      }
    }
  };


  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const onViewBooking = (b: Booking) => {
    const room = rooms.find(r => r.id === b.roomId);
    const pin = room?.pinLock || b.pinCode;

    SwalStyled.fire({
      title: '📋 ข้อมูลการเข้าพัก',
      html: `
        <div class="text-left font-sans">
          <div class="bg-[#1a1916]/5 rounded-xl p-4 mb-4 border border-[#1a1916]/10">
            <div class="text-[10px] text-[#8a8780] uppercase tracking-wider mb-1">ผู้เข้าพัก / Guest</div>
            <div class="font-bold text-[16px] text-[#1a1916]">${b.customerName}</div>
            <div class="text-[12px] text-[#8a8780] mt-1">LINE: ${b.customerLine || '-'}</div>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="border border-[#e2e0d8] rounded-xl p-3 bg-white">
              <div class="text-[10px] text-[#8a8780] mb-0.5">วันที่เข้าพัก / Stay</div>
              <div class="font-bold text-[13px] text-[#1a1916] leading-snug">${formatDate(b.checkIn)}</div>
              <div class="text-[10px] text-[#8a8780]">ถึง ${formatDate(b.checkOut)}</div>
            </div>
             <div class="border border-[#e2e0d8] rounded-xl p-3 bg-white">
              <div class="text-[10px] text-[#8a8780] mb-0.5">รหัส PIN / Locker</div>
              <div class="font-mono font-bold text-[16px] text-[#c9440f]">${pin || '-'}</div>
            </div>
          </div>
        </div>
      `,
      confirmButtonText: 'รับทราบ',
      width: 400,
    });
  };

  if (loading && rooms.length === 0) return (
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
              <div key={r.id} className={`border rounded-xl p-3 transition-all hover:shadow-md group bg-white flex flex-col ${isOccupied ? 'border-t-[4px] border-t-[#c9440f] border-[#e2e0d8]' :
                isAvailable ? 'border-t-[4px] border-t-[#1a7a4a] border-[#e2e0d8]' : 'border-t-[4px] border-t-[#8a8780] border-[#e2e0d8] opacity-70'
                }`}>

                {/* Room Image */}
                <div className="w-full h-[140px] rounded-lg mb-3 overflow-hidden bg-[#f5f4f0] shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.imageUrl || '/mock_room.png'}
                    alt={r.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = '/mock_room.png'; }}
                  />
                  {/* Status Overlay on Image */}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md ${isOccupied ? 'bg-white/90 text-[#c9440f]' : isAvailable ? 'bg-[#1a7a4a]/90 text-white' : 'bg-black/50 text-white'}`}>
                    {isOccupied ? 'มีผู้พัก' : isAvailable ? 'ว่าง' : 'ระงับ'}
                  </div>
                </div>

                {/* Room Header */}
                <div className="flex items-start justify-between mb-2 px-1">
                  <div>
                    <div className="font-mono text-[18px] font-medium">{r.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8a8780]">
                        <Users className="w-3 h-3" /> {r.capacity} ท่าน
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8a8780]">
                        ฿ {Number(r.price || 0).toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8a8780]">
                        <Lock className="w-3 h-3" /> {r.lockId || '-'}
                      </span>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditRoom(r)} className="p-1.5 rounded-md hover:bg-[#fdf8e7] text-[#b58a00] transition-colors" title="แก้ไข">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDeleteRoom(r)} className="p-1.5 rounded-md hover:bg-[#fef2f2] text-[#dc2626] transition-colors" title="ลบ">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#f0ece8]">
                  <button
                    onClick={() => onToggleRoomActive(r.id, r.isActive)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-[12px] font-medium transition-all ${r.isActive
                      ? 'border-[#1a7a4a]/20 bg-[#eaf5ef] text-[#1a7a4a] hover:bg-[#d4ede1]'
                      : 'border-[#d0cdc2] bg-white text-[#8a8780] hover:bg-[#f5f4f0]'
                      }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {r.isActive ? 'เปิดอยู่' : 'ปิดอยู่'}
                  </button>

                  {isOccupied && activeBooking && (
                    <>
                      <button
                        onClick={() => onViewBooking(activeBooking)}
                        className="flex items-center justify-center p-2.5 rounded-lg border border-[#1a4fa0]/20 bg-[#eaf0fb] text-[#1a4fa0] hover:bg-[#d4e4fd] transition-all"
                        title="ดูข้อมูลการเข้าพัก"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onCheckOut(activeBooking)}
                        className="flex items-center justify-center p-2.5 rounded-lg border border-[#c9440f]/20 bg-[#fdf5f2] text-[#c9440f] hover:bg-[#fce9e1] transition-all"
                        title="เช็คเอาท์ทันที"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
