import { put } from '@vercel/blob';
import * as roomService from './roomService';
import * as bookingService from './bookingService';
import { getSystemSettings } from './settingsService';

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
