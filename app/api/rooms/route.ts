import { NextRequest, NextResponse } from 'next/server';
import { getRooms, createRoom } from '@/lib/db';
import { Room } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const min_capacity = searchParams.get('min_capacity') ? parseInt(searchParams.get('min_capacity')!) : undefined;
    const equipment = searchParams.get('equipment') || undefined;
    const status = searchParams.get('status') || undefined;

    const rooms = getRooms({ type, min_capacity, equipment, status });
    return NextResponse.json({ success: true, data: rooms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Omit<Room, 'bookings'>;
    if (!body.id) {
      body.id = `room-${Date.now().toString(36)}`;
    }
    const created = createRoom(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
