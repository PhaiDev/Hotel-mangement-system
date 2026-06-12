import * as roomRepo from '@/lib/repositories/roomRepo';
import { Room } from '@/lib/supabase';

export async function getRooms(): Promise<Room[]> {
  return roomRepo.getAllRooms();
}

export async function getRoom(id: number): Promise<Room | null> {
  return roomRepo.getRoomById(id);
}

export async function createRoom(data: Omit<Room, 'id' | 'createdAt'>): Promise<Room> {
  return roomRepo.createRoom(data);
}

export async function updateRoom(id: number, data: Partial<Omit<Room, 'id' | 'createdAt'>>): Promise<Room> {
  return roomRepo.updateRoom(id, data);
}

export async function deleteRoom(id: number): Promise<void> {
  return roomRepo.deleteRoom(id);
}

export async function updateRoomActiveState(id: number, isActive: boolean): Promise<Room> {
  return roomRepo.updateRoom(id, { isActive });
}
