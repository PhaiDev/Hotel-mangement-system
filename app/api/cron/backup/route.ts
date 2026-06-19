import { NextRequest, NextResponse } from 'next/server';
import { DriveBackup } from '@/lib/services/backupService';

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
    const result = await DriveBackup();

    if (!result?.success) {
      console.error('API Backup Error:', result);
      return NextResponse.json(
        {
          error: 'Backup failed',
          ...result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      messages : 'Backup completed successfully',
      ...result,
    });
  } catch (error) {
    console.error('API Backup Error:', error);
    return NextResponse.json(
      { error: 'Backup failed', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
