import { supabaseAdmin } from '@/lib/supabase/admin';
import { Room } from '@/lib/supabase';

export async function getAllRooms(): Promise<Room[]> {
  const { data, error } = await supabaseAdmin
    .from('Room')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getRoomById(id: number): Promise<Room | null> {
  const { data, error } = await supabaseAdmin
    .from('Room')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createRoom(room: Omit<Room, 'id' | 'createdAt'>): Promise<Room> {
  const { data, error } = await supabaseAdmin
    .from('Room')
    .insert([room])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateRoom(id: number, room: Partial<Omit<Room, 'id' | 'createdAt'>>): Promise<Room> {
  const { data, error } = await supabaseAdmin
    .from('Room')
    .update(room)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteRoom(id: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('Room')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
