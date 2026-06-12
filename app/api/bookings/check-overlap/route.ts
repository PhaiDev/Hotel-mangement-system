import { NextRequest, NextResponse } from 'next/server';
import * as bookingService from '@/lib/services/bookingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = Number(searchParams.get('roomId'));
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const excludeId = searchParams.get('excludeId') ? Number(searchParams.get('excludeId')) : undefined;

    if (!roomId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const isOverlap = await bookingService.checkBookingOverlap(roomId, checkIn, checkOut, excludeId);
    return NextResponse.json({ data: isOverlap });
  } catch (error) {
    console.error('API Bookings Check-Overlap GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
