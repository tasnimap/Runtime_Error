import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncementById, updateAnnouncement, deleteAnnouncement } from '@/lib/db';
import { Announcement } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const announcement = getAnnouncementById(params.id);
    if (!announcement) {
      return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: announcement });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as Partial<Announcement>;
    const updated = updateAnnouncement(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = deleteAnnouncement(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
