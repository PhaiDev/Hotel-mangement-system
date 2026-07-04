import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateRoom } from '@/lib/validators/room';
import { validateBooking } from '@/lib/validators/booking';
import { checkOverlap } from '@/lib/repositories/bookingRepo';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'สิทธิ์การใช้งานไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่ (Unauthorized)' }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();
    const { type, items, ignoreOverlap = false } = body;

    if (!type || !Array.isArray(items)) {
      return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง (Invalid payload format)' }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ data: [], count: 0, message: 'ไม่มีข้อมูลให้นำเข้า' });
    }

    if (type === 'rooms') {
      // Validate all rooms
      const validatedRooms = [];
      const errors: string[] = [];

      for (let i = 0; i < items.length; i++) {
        try {
          const validated = validateRoom(items[i]);
          validatedRooms.push(validated);
        } catch (err) {
          errors.push(`แถวที่ ${i + 1}: ${err instanceof Error ? err.message : 'ข้อมูลไม่ถูกต้อง'}`);
        }
      }

      if (errors.length > 0) {
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล', details: errors }, { status: 400 });
      }

      // Perform bulk insert
      const { data, error } = await supabaseAdmin
        .from('Room')
        .insert(validatedRooms)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        count: data?.length || 0,
        message: `นำเข้าข้อมูลห้องพักสำเร็จจำนวน ${data?.length || 0} ห้อง`,
        data
      });

    } else if (type === 'bookings') {
      // Validate all bookings
      const validatedBookings = [];
      const errors: string[] = [];

      // Fetch all existing rooms to verify roomId exists
      const { data: existingRooms, error: roomsError } = await supabaseAdmin
        .from('Room')
        .select('id');

      if (roomsError) throw new Error('ไม่สามารถตรวจสอบข้อมูลห้องพักได้: ' + roomsError.message);
      const roomIds = new Set((existingRooms || []).map(r => r.id));

      for (let i = 0; i < items.length; i++) {
        try {
          const rawItem = items[i];
          const validated = validateBooking(rawItem);

          if (!roomIds.has(validated.roomId)) {
            throw new Error(`ไม่พบรหัสห้องพัก (roomId: ${validated.roomId}) ในระบบ`);
          }

          // Check overlap if not ignored
          if (!ignoreOverlap) {
            const isOverlap = await checkOverlap(validated.roomId, validated.checkIn, validated.checkOut);
            if (isOverlap) {
              throw new Error(`ห้องพักไม่ว่างในช่วงเวลาดังกล่าว (${validated.checkIn} ถึง ${validated.checkOut})`);
            }
          }

          validatedBookings.push(validated);
        } catch (err) {
          errors.push(`แถวที่ ${i + 1}: ${err instanceof Error ? err.message : 'ข้อมูลไม่ถูกต้อง'}`);
        }
      }

      if (errors.length > 0) {
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล', details: errors }, { status: 400 });
      }

      // Perform bulk insert
      const { data, error } = await supabaseAdmin
        .from('Booking')
        .insert(validatedBookings)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        count: data?.length || 0,
        message: `นำเข้าข้อมูลการจองสำเร็จจำนวน ${data?.length || 0} รายการ`,
        data
      });

    } else {
      return NextResponse.json({ error: 'ประเภทข้อมูลไม่ถูกต้อง (Invalid type: rooms or bookings)' }, { status: 400 });
    }

  } catch (error) {
    console.error('Import API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในระบบเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
