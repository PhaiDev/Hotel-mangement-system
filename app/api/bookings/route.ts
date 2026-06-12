import { NextRequest, NextResponse } from 'next/server';
import * as bookingService from '@/lib/services/bookingService';
import { validateBooking } from '@/lib/validators/booking';

export async function GET() {
  try {
    const data = await bookingService.getBookings();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Bookings GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateBooking(body);
    const data = await bookingService.createBooking(validatedData);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API Bookings POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bad Request' },
      { status: 400 }
    );
  }
}
