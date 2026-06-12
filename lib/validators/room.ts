import { Room } from '@/lib/supabase';

const asStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
};

const asNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export function validateRoom(payload: unknown): Omit<Room, 'id' | 'createdAt'> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload');
  }

  const body = payload as Record<string, unknown>;
  const name = asStringOrNull(body.name);

  if (!name) throw new Error('ชื่อห้อง (name) เป็นข้อมูลที่จำเป็น');

  return {
    name,
    lockId: asStringOrNull(body.lockId) || '',
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    price: asNumber(body.price, 0),
    capacity: asNumber(body.capacity, 1),
    pinLock: asStringOrNull(body.pinLock) || '',
    imageUrl: asStringOrNull(body.imageUrl) || undefined,
  };
}

export function validateRoomUpdate(payload: unknown): Partial<Omit<Room, 'id' | 'createdAt'>> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload');
  }

  const body = payload as Record<string, unknown>;
  const update: Partial<Omit<Room, 'id' | 'createdAt'>> = {};

  if (body.name !== undefined) {
    const name = asStringOrNull(body.name);
    if (!name) throw new Error('ชื่อห้อง (name) ไม่สามารถเป็นค่าว่างได้');
    update.name = name;
  }

  if (body.lockId !== undefined) update.lockId = asStringOrNull(body.lockId) || '';
  if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);
  if (body.price !== undefined) update.price = asNumber(body.price, 0);
  if (body.capacity !== undefined) update.capacity = asNumber(body.capacity, 1);
  if (body.pinLock !== undefined) update.pinLock = asStringOrNull(body.pinLock) || '';
  if (body.imageUrl !== undefined) update.imageUrl = asStringOrNull(body.imageUrl) || undefined;

  return update;
}
