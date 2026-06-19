import { put } from '@vercel/blob';
import * as roomService from './roomService';
import * as bookingService from './bookingService';
import { getSystemSettings } from './settingsService';

async function blobToBase64(blob : Blob) {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const byte = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0 ; i < byte.byteLength ; i += chunkSize) {
    binary += String.fromCharCode(...byte.subarray(i,i + chunkSize))
  }

  return btoa(binary)
}

export async function DriveBackup() {
  const bookings = await bookingService.getBookings();
  const headers = ['รหัสการจอง', 'ชื่อลูกค้า', 'เบอร์ติดต่อ/LINE', 'ห้องพัก', 'วันที่เช็คอิน', 'วันที่เช็คเอาท์', 'ยอดเงิน', 'สถานะ', 'วันที่สร้าง'];
  //const headers = ['ไอดี','จุคน','ชื่อ'];
  const filename = `backups/sumotel_db_${new Date().toISOString().split('T')[0]}.csv`;
  const csvRows = [headers.join(',')];

  bookings.forEach(b => {
    const row = [
      b.id,
      b.customerName,
      b.customerLine,
      b.roomId,
      b.checkIn,
      b.checkOut,
      b.totalPrice,
      b.status,
      b.createdAt
    ];
    csvRows.push(row.join(','));
  });

  const csvString = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvString],{ type: 'text/csv;charset=utf-8;' });
  const fileData = await blobToBase64(blob);
  const backupUrl = process.env.APP_SCRIPT_BACKUP?.trim();

  if (!backupUrl) {
    return {
      success: false,
      message: 'APP_SCRIPT_BACKUP ยังไม่ถูกตั้งค่า',
      fileName: filename,
    };
  }

  try {
    const response = await fetch(backupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: filename,
        fileData,
      }),
    });

    const responseText = await response.text();
    let responseBody: unknown = responseText;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      // ถ้าไม่ใช่ JSON ก็เก็บเป็นข้อความปกติ
    }

    if (!response.ok) {
      return {
        success: false,
        message: 'ส่งข้อมูล backup ไปยัง App Script ไม่สำเร็จ',
        status: response.status,
        statusText: response.statusText,
        responseBody,
        fileName: filename,
      };
    }

    return {
      success: true,
      message: 'ส่งข้อมูล backup ไปยัง App Script สำเร็จ',
      status: response.status,
      responseBody,
      fileName: filename,
    };
  } catch (error) {
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดขณะเรียก API backup',
      error: error instanceof Error ? error.message : String(error),
      fileName: filename,
    };
  }
}

export async function runBackup() {
  try {
    // 1. Fetch all data
    const [rooms, bookings, settings] = await Promise.all([
      roomService.getRooms(),
      bookingService.getBookings(),
      getSystemSettings(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      rooms,
      bookings,
      settings,
    };

    // 2. Format filename
    const filename = `backups/sumotel_db_${new Date().toISOString().split('T')[0]}.json`;

    // 3. Upload to Vercel Blob
    const file = JSON.stringify(backupData, null, 2);
    const { url } = await put(filename, file, {
      access: 'public', // Change to 'private' if you have a Pro plan and prefer it
      contentType: 'application/json',
    });

    console.log(`Backup successful: ${url}`);
    return { success: true, url, filename };
  } catch (error) {
    console.error('Backup Service Error:', error);
    throw error;
  }
}
