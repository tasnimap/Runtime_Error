import { NextRequest, NextResponse } from 'next/server';
import { getAssignments, createAssignment } from '@/lib/db';
import { Assignment } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const course = searchParams.get('course') || undefined;
    const due_before = searchParams.get('due_before') || undefined;

    const assignments = getAssignments({ status, course, due_before });
    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Assignment;
    if (!body.id) {
      body.id = `asgn-${Date.now().toString(36)}`;
    }
    if (!body.status) {
      body.status = 'pending';
    }
    const created = createAssignment(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
