import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Invalid share ID' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // Track global view count
    await kv.incr('share:analytics:viewed:total');
    await kv.set('share:analytics:viewed:last', timestamp);

    // Track view count for this specific share
    await kv.incr(`share:views:${id}`);

    // Track unique viewers by day (approximate)
    const today = new Date().toISOString().split('T')[0];
    await kv.sadd(`share:viewers:${id}:${today}`, request.headers.get('x-forwarded-for') || 'unknown');

    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't fail - view tracking is non-critical
    console.error('Failed to track share view:', error);
    return NextResponse.json({ success: true });
  }
}
