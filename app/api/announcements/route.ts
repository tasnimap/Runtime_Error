import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncements, createAnnouncement } from '@/lib/db';
import { Announcement } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority') || undefined;
    const active_only = searchParams.get('active_only') === 'true';
    const current_date = searchParams.get('current_date') || undefined;

    const announcements = getAnnouncements({ priority, active_only, current_date });
    return NextResponse.json({ success: true, data: announcements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Announcement;
    if (!body.id) {
      body.id = `ann-${Date.now().toString(36)}`;
    }
    const created = createAnnouncement(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
