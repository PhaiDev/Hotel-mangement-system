import { createClient } from '@/lib/supabase/client';

// ---- SCHEMA ----
export interface Room {
  id: number;
  name: string;
  lockId: string;
  isActive: boolean;
  capacity: number;
  createdAt: string;
  pinLock: string;
}

export type BookingStatus = 'PENDING' | 'PAID' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
  id: number;
  customerName: string;
  customerLine: string;
  roomId: number;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  pinCode?: string;
  totalPrice: number;
  createdAt: string;
}

export interface Settings {
  hotelName: string;
  promptpay: string;
}


export const backend = {
  // ===== ROOMS =====
  getRooms: async (): Promise<Room[]> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('Room').select('*').order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  createRoom: async (payload: Omit<Room, 'id' | 'createdAt'>): Promise<Room> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('Room').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateRoom: async (id: number, payload: Partial<Omit<Room, 'id' | 'createdAt'>>): Promise<Room> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('Room').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteRoom: async (id: number): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from('Room').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  updateRoomActiveState: async (id: number, isActive: boolean): Promise<Room> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('Room').update({ isActive }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  // ===== BOOKINGS =====
  getBookings: async (): Promise<Booking[]> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('Booking').select('*').order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  checkBookingOverlap: async (roomId: number, checkIn: string, checkOut: string, excludeId?: number): Promise<boolean> => {
    const supabase = createClient();
    let query = supabase
      .from('Booking')
      .select('id')
      .eq('roomId', roomId)
      .neq('status', 'CANCELLED')
      // Rule: (StartA < EndB) AND (EndA > StartB)
      .lt('checkIn', checkOut)
      .gt('checkOut', checkIn);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data && data.length > 0) || false;
  },

  createBooking: async (payload: Omit<Booking, 'id' | 'createdAt' | 'status' | 'pinCode'>): Promise<Booking> => {
    const isOverlap = await backend.checkBookingOverlap(payload.roomId, payload.checkIn, payload.checkOut);
    if (isOverlap) throw new Error('ห้องพักไม่ว่างในช่วงเวลาที่เลือก');

    const supabase = createClient();
    const { data, error } = await supabase.from('Booking').insert([{
      ...payload,
      status: 'PENDING',
    }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateBooking: async (id: number, payload: Partial<Omit<Booking, 'id' | 'createdAt'>>): Promise<Booking> => {
    const supabase = createClient();

    // If dates or room are changing, check for overlap
    if (payload.checkIn || payload.checkOut || payload.roomId) {
      // Need current booking data if some fields are missing in payload
      const { data: existing } = await supabase.from('Booking').select('*').eq('id', id).single();
      if (existing) {
        const rId = payload.roomId ?? existing.roomId;
        const cIn = payload.checkIn ?? existing.checkIn;
        const cOut = payload.checkOut ?? existing.checkOut;
        const isOverlap = await backend.checkBookingOverlap(rId, cIn, cOut, id);
        if (isOverlap) throw new Error('ไม่สามารถบันทึกได้ เนื่องจากห้องพักถูกจองแล้วในช่วงเวลาดังกล่าว');
      }
    }

    const { data, error } = await supabase.from('Booking').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateBookingStatus: async (id: number, status: BookingStatus, pinCode?: string): Promise<Booking> => {
    const supabase = createClient();
    const updateData: any = { status };
    if (pinCode !== undefined) updateData.pinCode = pinCode;
    const { data, error } = await supabase.from('Booking').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteBooking: async (id: number): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from('Booking').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  updateBookingPin: async (id: number, pinCode: string): Promise<Booking> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('Booking').update({ pinCode }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
};
