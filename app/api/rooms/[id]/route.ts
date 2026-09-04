import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom, deleteRoom } from '@/lib/db';
import { Room } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const room = getRoomById(params.id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: room });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as Partial<Room>;
    const updated = updateRoom(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = deleteRoom(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Room deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
