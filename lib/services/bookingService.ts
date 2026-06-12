import * as bookingRepo from '@/lib/repositories/bookingRepo';
import { Booking } from '@/lib/supabase';

export async function getBookings(): Promise<Booking[]> {
  return bookingRepo.getAllBookings();
}

export async function getBooking(id: number): Promise<Booking | null> {
  return bookingRepo.getBookingById(id);
}

export async function createBooking(data: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  const isOverlap = await bookingRepo.checkOverlap(data.roomId, data.checkIn, data.checkOut);
  if (isOverlap) {
    throw new Error('ห้องพักไม่ว่างในช่วงเวลาที่เลือก (Room is already booked for this period)');
  }
  return bookingRepo.createBooking(data);
}

export async function updateBooking(id: number, data: Partial<Omit<Booking, 'id' | 'createdAt'>>): Promise<Booking> {
  // If dates or room are changing, check for overlap
  if (data.checkIn || data.checkOut || data.roomId) {
    const existing = await bookingRepo.getBookingById(id);
    if (existing) {
      const rId = data.roomId ?? existing.roomId;
      const cIn = data.checkIn ?? existing.checkIn;
      const cOut = data.checkOut ?? existing.checkOut;
      const isOverlap = await bookingRepo.checkOverlap(rId, cIn, cOut, id);
      if (isOverlap) {
        throw new Error('ไม่สามารถบันทึกได้ เนื่องจากห้องพักถูกจองแล้วในช่วงเวลาดังกล่าว (Room is already booked for this period)');
      }
    }
  }
  return bookingRepo.updateBooking(id, data);
}

export async function deleteBooking(id: number): Promise<void> {
  return bookingRepo.deleteBooking(id);
}

export async function checkBookingOverlap(roomId: number, checkIn: string, checkOut: string, excludeId?: number): Promise<boolean> {
  return bookingRepo.checkOverlap(roomId, checkIn, checkOut, excludeId);
}
