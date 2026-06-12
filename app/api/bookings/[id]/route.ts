import { NextRequest, NextResponse } from 'next/server';
import * as bookingService from '@/lib/services/bookingService';
import { validateBookingUpdate } from '@/lib/validators/booking';

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const data = await bookingService.getBooking(Number(id));
    if (!data) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Bookings/:id GET Error:', error);
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
    const validatedData = validateBookingUpdate(body);
    const data = await bookingService.updateBooking(Number(id), validatedData);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Bookings/:id PUT Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bad Request' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    await bookingService.deleteBooking(Number(id));
    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('API Bookings/:id DELETE Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
