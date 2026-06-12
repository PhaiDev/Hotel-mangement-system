import { NextRequest, NextResponse } from 'next/server';
import * as roomService from '@/lib/services/roomService';
import { validateRoomUpdate } from '@/lib/validators/room';

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const data = await roomService.getRoom(Number(id));
    if (!data) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Rooms/:id GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = validateRoomUpdate(body);
    const data = await roomService.updateRoom(Number(id), validatedData);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Rooms/:id PUT Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bad Request' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    await roomService.deleteRoom(Number(id));
    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('API Rooms/:id DELETE Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
