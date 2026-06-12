import { NextRequest, NextResponse } from 'next/server';
import * as roomService from '@/lib/services/roomService';
import { validateRoom } from '@/lib/validators/room';

export async function GET() {
  try {
    const data = await roomService.getRooms();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Rooms GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateRoom(body);
    const data = await roomService.createRoom(validatedData);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API Rooms POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bad Request' },
      { status: 400 }
    );
  }
}
