import { NextResponse } from 'next/server';
import { getSystemSettings, updateSystemSettings } from '@/lib/services/settingsService';

export async function GET() {
  try {
    const data = await getSystemSettings();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const data = await updateSystemSettings(payload);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update settings';
    const status = message.startsWith('Invalid') || message.includes('required') || message.includes('must be') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
