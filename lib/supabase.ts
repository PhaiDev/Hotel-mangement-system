import { createClient } from '@/lib/supabase/client';

// Re-defining interfaces here to ensure they match what we expect
export interface Room {
  id: number;
  name: string;
  lockId: string;
  isActive: boolean;
  price: number;
  capacity: number;
  createdAt: string;
  pinLock: string;
  imageUrl?: string;
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
  imageId?: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || json.message || 'API Request failed');
  }
  return json.data;
}

export const backend = {
  // ===== ROOMS =====
  getRooms: async (): Promise<Room[]> => {
    return apiFetch<Room[]>('/api/rooms');
  },

  createRoom: async (payload: Omit<Room, 'id' | 'createdAt'>): Promise<Room> => {
    return apiFetch<Room>('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  updateRoom: async (id: number, payload: Partial<Omit<Room, 'id' | 'createdAt'>>): Promise<Room> => {
    return apiFetch<Room>(`/api/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  deleteRoom: async (id: number): Promise<void> => {
    await apiFetch(`/api/rooms/${id}`, { method: 'DELETE' });
  },

  updateRoomActiveState: async (id: number, isActive: boolean): Promise<Room> => {
    return apiFetch<Room>(`/api/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
  },

  // ===== BOOKINGS =====
  getBookings: async (): Promise<Booking[]> => {
    return apiFetch<Booking[]>('/api/bookings');
  },

  checkBookingOverlap: async (roomId: number, checkIn: string, checkOut: string, excludeId?: number): Promise<boolean> => {
    // We can still expose this if needed, but the server now handles it during create/update
    // To implement this as an API, we'd need a dedicated endpoint or search params
    const query = new URLSearchParams({
      roomId: String(roomId),
      checkIn,
      checkOut,
    });
    if (excludeId) query.append('excludeId', String(excludeId));
    
    // For now, let's just use a simple check in the service if we really need it on the frontend
    // but the actual validation is now on the server.
    // If we want to keep the UI feedback, we can add a simple GET /api/bookings/check-overlap
    return apiFetch<boolean>(`/api/bookings/check-overlap?${query.toString()}`);
  },

  createBooking: async (payload: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
    return apiFetch<Booking>('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  updateBooking: async (id: number, payload: Partial<Omit<Booking, 'id' | 'createdAt'>>): Promise<Booking> => {
    return apiFetch<Booking>(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  updateBookingStatus: async (id: number, status: BookingStatus, pinCode?: string): Promise<Booking> => {
    const updateData: { status: BookingStatus; pinCode?: string } = { status };
    if (pinCode !== undefined) updateData.pinCode = pinCode;
    return apiFetch<Booking>(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
  },

  deleteBooking: async (id: number): Promise<void> => {
    await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' });
  },

  updateBookingPin: async (id: number, pinCode: string): Promise<Booking> => {
    return apiFetch<Booking>(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinCode }),
    });
  }
};
