import { Booking, BookingStatus } from '@/lib/supabase';

const asStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
};

const asNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const VALID_STATUSES: BookingStatus[] = ['PENDING', 'PAID', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

export function validateBooking(payload: unknown): Omit<Booking, 'id' | 'createdAt'> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload');
  }

  const body = payload as Record<string, unknown>;
  const customerName = asStringOrNull(body.customerName);
  const roomId = asNumber(body.roomId, 0);
  const checkIn = asStringOrNull(body.checkIn);
  const checkOut = asStringOrNull(body.checkOut);

  if (!customerName) throw new Error('ชื่อลูกค้า (customerName) เป็นข้อมูลที่จำเป็น');
  if (roomId <= 0) throw new Error('รหัสห้องพัก (roomId) ไม่ถูกต้อง');
  if (!checkIn) throw new Error('วันที่เช็คอิน (checkIn) เป็นข้อมูลที่จำเป็น');
  if (!checkOut) throw new Error('วันที่เช็คเอาท์ (checkOut) เป็นข้อมูลที่จำเป็น');

  let status = body.status as BookingStatus;
  if (!VALID_STATUSES.includes(status)) {
    status = 'PENDING';
  }

  return {
    customerName,
    customerLine: asStringOrNull(body.customerLine) || '',
    roomId,
    checkIn,
    checkOut,
    status,
    totalPrice: asNumber(body.totalPrice, 0),
    pinCode: asStringOrNull(body.pinCode) || undefined,
    imageId: asStringOrNull(body.imageId) || undefined,
  };
}

export function validateBookingUpdate(payload: unknown): Partial<Omit<Booking, 'id' | 'createdAt'>> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload');
  }

  const body = payload as Record<string, unknown>;
  const update: Partial<Omit<Booking, 'id' | 'createdAt'>> = {};

  if (body.customerName !== undefined) update.customerName = asStringOrNull(body.customerName) || '';
  if (body.customerLine !== undefined) update.customerLine = asStringOrNull(body.customerLine) || '';
  if (body.roomId !== undefined) update.roomId = asNumber(body.roomId, 0);
  if (body.checkIn !== undefined) update.checkIn = asStringOrNull(body.checkIn) || '';
  if (body.checkOut !== undefined) update.checkOut = asStringOrNull(body.checkOut) || '';
  
  if (body.status !== undefined) {
    const status = body.status as BookingStatus;
    if (VALID_STATUSES.includes(status)) {
      update.status = status;
    }
  }

  if (body.totalPrice !== undefined) update.totalPrice = asNumber(body.totalPrice, 0);
  if (body.pinCode !== undefined) update.pinCode = asStringOrNull(body.pinCode) || undefined;
  if (body.imageId !== undefined) update.imageId = asStringOrNull(body.imageId) || undefined;

  return update;
}
