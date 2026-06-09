import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin.from('Booking').select('*');
        if (error) throw error;
        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const formdata = await request.formData();
        const file = formdata.get('file') as File;
        const bucket = (formdata.get('bucket') as string) || 'id_card';

        if (!file) {
            return NextResponse.json(
                { message: "ไม่พบไฟล์ที่อัปโหลด" },
                { status: 400 }
            );
        }

        const buffer = await file.arrayBuffer();
        
        // Create a safe filename - use timestamp + random string + extension
        const fileExtension = file.name.split('.').pop() || 'bin';
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `${Date.now()}-${randomStr}.${fileExtension}`;

        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(filename, Buffer.from(buffer), {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error(`Supabase upload error in bucket ${bucket}:`, error);
            return NextResponse.json(
                { message: 'เกิดข้อผิดพลาดในการอัปโหลดไปยัง storage', detail: error.message },
                { status: 500 }
            );
        }

        const { data: urlData } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(filename);

        return NextResponse.json(
            {
                message: 'อัปโหลดสำเร็จ',
                filename: filename,
                url: urlData?.publicUrl,
                imageId: filename, // Legacy support
                path: data?.path,
            }, 
            { status: 200 }
        );

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { message: 'เกิดข้อผิดพลาดภายในระบบ', detail: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
