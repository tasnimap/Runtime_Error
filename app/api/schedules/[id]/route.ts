import { NextRequest, NextResponse } from 'next/server';
import { getScheduleById, updateSchedule, deleteSchedule } from '@/lib/db';
import { Schedule } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schedule = getScheduleById(params.id);
    if (!schedule) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: schedule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as Partial<Schedule>;
    const updated = updateSchedule(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = deleteSchedule(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
