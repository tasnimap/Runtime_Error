import { NextRequest, NextResponse } from 'next/server';
import { getEvents, createEvent } from '@/lib/db';
import { CampusEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const status = searchParams.get('status') || undefined;
    const venue = searchParams.get('venue') || undefined;

    const events = getEvents({ date, status, venue });
    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Omit<CampusEvent, 'registrations'>;
    if (!body.id) {
      body.id = `evt-${Date.now().toString(36)}`;
    }
    if (body.registered === undefined) {
      body.registered = 0;
    }
    if (!body.status) {
      body.status = 'upcoming';
    }
    const created = createEvent(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
