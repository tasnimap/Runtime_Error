import { NextRequest, NextResponse } from 'next/server';
import { getSchedules, createSchedule } from '@/lib/db';
import { Schedule } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get('day') || undefined;
    const course = searchParams.get('course') || undefined;
    const room = searchParams.get('room') || undefined;
    const instructor = searchParams.get('instructor') || undefined;

    const schedules = getSchedules({ day, course, room, instructor });
    return NextResponse.json({ success: true, data: schedules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Schedule;
    if (!body.id) {
      body.id = `sch-${Date.now().toString(36)}`;
    }
    const created = createSchedule(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
