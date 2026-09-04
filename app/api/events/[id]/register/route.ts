import { NextRequest, NextResponse } from 'next/server';
import { registerEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { student_id, name } = body;

    if (!student_id || !name) {
      return NextResponse.json({ success: false, error: 'Missing required fields: student_id, name' }, { status: 400 });
    }

    const result = registerEvent({
      eventIdOrName: params.id,
      student_id,
      name,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.event });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
