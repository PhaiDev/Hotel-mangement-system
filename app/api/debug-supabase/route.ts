import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // 1. Check Env Vars
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 2. Try raw query to check tables
    const { data: rooms, error: roomError } = await supabaseAdmin.from('Room').select('count', { count: 'exact', head: true });
    const { data: bookings, error: bookingError } = await supabaseAdmin.from('Booking').select('count', { count: 'exact', head: true });

    return NextResponse.json({
      config: {
        url,
        hasServiceKey,
        hasAnonKey,
      },
      diagnostic: {
        roomTable: {
          success: !roomError,
          error: roomError ? roomError.message : null,
          count: rooms
        },
        bookingTable: {
          success: !bookingError,
          error: bookingError ? bookingError.message : null,
          count: bookings
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
