import { NextRequest, NextResponse } from 'next/server';
import { getShare, deleteShare } from '@/lib/share-storage';
import type { SharedEvaluation } from '@/lib/share-types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!id || id.length < 5) {
      return NextResponse.json(
        { error: 'Invalid share ID' },
        { status: 400 }
      );
    }

    const share = await getShare(id);

    if (!share) {
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json(share);
  } catch (error) {
    console.error('Failed to get share:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve share' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid share ID' },
        { status: 400 }
      );
    }

    // For now, anyone can delete a share
    // In the future, this should check ownership
    await deleteShare(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete share:', error);
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    );
  }
}
