import { supabaseAdmin } from '@/lib/supabase/admin';
import { Booking } from '@/lib/supabase';

export async function getAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabaseAdmin
    .from('Booking')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getBookingById(id: number): Promise<Booking | null> {
  const { data, error } = await supabaseAdmin
    .from('Booking')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  const { data, error } = await supabaseAdmin
    .from('Booking')
    .insert([booking])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBooking(id: number, booking: Partial<Omit<Booking, 'id' | 'createdAt'>>): Promise<Booking> {
  const { data, error } = await supabaseAdmin
    .from('Booking')
    .update(booking)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBooking(id: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('Booking')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Check if a room is available for a given time range.
 * Rule: (StartA < EndB) AND (EndA > StartB)
 */
export async function checkOverlap(roomId: number, checkIn: string, checkOut: string, excludeId?: number): Promise<boolean> {
  let query = supabaseAdmin
    .from('Booking')
    .select('id')
    .eq('roomId', roomId)
    .neq('status', 'CANCELLED')
    .lt('checkIn', checkOut)
    .gt('checkOut', checkIn);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data && data.length > 0) || false;
}
