import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(req: NextRequest) {
  try {
    const { event, data } = await req.json();

    if (!event) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Log event for Vercel logs (fallback if KV not available)
    console.log(`[ANALYTICS] event=${event}`, JSON.stringify(data || {}));

    // Try to store in Vercel KV
    try {
      const timestamp = new Date().toISOString();

      // Increment total counter for this event
      await kv.incr(`analytics:${event}:total`);

      // Track by provider if provided
      if (data?.provider) {
        await kv.incr(`analytics:${event}:provider:${data.provider}`);
      }

      // Track by model if provided
      if (data?.model) {
        await kv.incr(`analytics:${event}:model:${data.model}`);
      }

      // Store last occurrence timestamp
      await kv.set(`analytics:${event}:last`, timestamp);

      // For error tracking, store error types
      if (event === 'generation_error' && data?.error_type) {
        await kv.incr(`analytics:generation_error:type:${data.error_type}`);
      }

    } catch (kvError) {
      // KV not configured - that's okay, we logged to console
      console.log('[ANALYTICS] KV not available, event logged to console only');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ANALYTICS] Error tracking event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
