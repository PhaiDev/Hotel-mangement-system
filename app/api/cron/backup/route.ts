import { NextRequest, NextResponse } from 'next/server';
import { runBackup } from '@/lib/services/backupService';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  // Verify CRON_SECRET to ensure only Vercel Cron can trigger this
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await runBackup();
    return NextResponse.json({ 
      message: 'Backup completed successfully',
      ...result 
    });
  } catch (error) {
    console.error('API Backup Error:', error);
    return NextResponse.json(
      { error: 'Backup failed', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
