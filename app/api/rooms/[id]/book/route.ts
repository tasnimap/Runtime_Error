import { NextRequest, NextResponse } from 'next/server';
import { bookRoom } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { booked_by, date, start_time, end_time, purpose } = body;

    if (!booked_by || !date || !start_time || !end_time || !purpose) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: booked_by, date, start_time, end_time, purpose' },
        { status: 400 }
      );
    }

    const result = bookRoom({
      roomIdOrNumber: params.id,
      booked_by,
      date,
      start_time,
      end_time,
      purpose,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: result.booking }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
