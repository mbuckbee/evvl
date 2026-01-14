import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { checkContentForSharing } from '@/lib/moderation';
import {
  generateShareId,
  getExpiryTimestamp,
  checkRateLimit,
  incrementRateLimit,
  saveShare,
  getClientIP
} from '@/lib/share-storage';
import type { CreateShareRequest, SharedEvaluation, CreateShareResult } from '@/lib/share-types';

// Track share analytics
async function trackShareEvent(event: string, data?: Record<string, any>) {
  try {
    const timestamp = new Date().toISOString();
    await kv.incr(`share:analytics:${event}:total`);
    await kv.set(`share:analytics:${event}:last`, timestamp);

    // Track by specific attributes if provided
    if (data?.responseCount) {
      await kv.incr(`share:analytics:${event}:responses:${data.responseCount}`);
    }
    if (data?.hasImages) {
      await kv.incr(`share:analytics:${event}:with_images`);
    }
    if (data?.flaggedCategory) {
      await kv.incr(`share:analytics:moderation_blocked:category:${data.flaggedCategory}`);
    }
  } catch (error) {
    // Don't fail the request if analytics fails
    console.error('Failed to track share event:', error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateShareResult>> {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(clientIP);
    if (!allowed) {
      await trackShareEvent('rate_limited');
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. You can create ${remaining} more shares today.`,
          code: 'RATE_LIMITED'
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body: CreateShareRequest = await request.json();

    // Validate request
    if (!body.prompt?.content || !body.responses?.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: prompt and responses are required',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      );
    }

    // Run content moderation on prompt and text responses
    const textResponses = body.responses
      .filter(r => r.type === 'text')
      .map(r => r.content);

    const moderationResult = await checkContentForSharing(
      body.prompt.content,
      body.prompt.systemPrompt,
      textResponses
    );

    if (!moderationResult.passed) {
      // Track each flagged category
      for (const category of moderationResult.flaggedCategories) {
        await trackShareEvent('moderation_blocked', { flaggedCategory: category });
      }
      return NextResponse.json(
        {
          success: false,
          error: `Content flagged for: ${moderationResult.flaggedCategories.join(', ')}. Please remove inappropriate content and try again.`,
          code: 'MODERATION_FAILED'
        },
        { status: 400 }
      );
    }

    // Generate share ID and expiry
    const shareId = generateShareId();
    const expiresAt = getExpiryTimestamp();

    // Create share object
    const share: SharedEvaluation = {
      id: shareId,
      createdAt: Date.now(),
      expiresAt,
      prompt: {
        name: body.prompt.name || 'Shared Prompt',
        content: body.prompt.content,
        systemPrompt: body.prompt.systemPrompt
      },
      responses: body.responses,
      title: body.title,
      description: body.description,
      variables: body.variables
    };

    // Save to storage
    await saveShare(share);

    // Increment rate limit counter
    await incrementRateLimit(clientIP);

    // Track successful share creation
    const hasImages = body.responses.some(r => r.type === 'image');
    await trackShareEvent('created', {
      responseCount: body.responses.length,
      hasImages
    });

    // Build share URL - use separate domain for user-generated content isolation
    const shareDomain = process.env.SHARE_DOMAIN || 'https://share.evvl.io';
    const shareUrl = `${shareDomain}/s/${shareId}`;

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl,
      expiresAt
    });

  } catch (error) {
    console.error('Failed to create share:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create share. Please try again.',
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
