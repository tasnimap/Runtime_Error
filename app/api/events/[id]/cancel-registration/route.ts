import { NextRequest, NextResponse } from 'next/server';
import { cancelEventRegistration } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { student_id } = body;

    if (!student_id) {
      return NextResponse.json({ success: false, error: 'Missing student_id' }, { status: 400 });
    }

    const result = cancelEventRegistration({
      eventIdOrName: params.id,
      student_id,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.event });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
