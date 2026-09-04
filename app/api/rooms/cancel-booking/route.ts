import { NextRequest, NextResponse } from 'next/server';
import { cancelBooking } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ success: false, error: 'Missing booking_id' }, { status: 400 });
    }

    const result = cancelBooking(booking_id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
