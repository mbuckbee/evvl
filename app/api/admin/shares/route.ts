import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { list, del } from '@vercel/blob';
import type { ShareMetadata } from '@/lib/share-types';

// Simple password authentication helper
function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const expectedPassword = process.env.BACKROOM_PASSWORD || 'evvl-admin-2024';
  return authHeader === `Bearer ${expectedPassword}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get share analytics
    const [
      createdTotal,
      createdLast,
      viewedTotal,
      viewedLast,
      rateLimitedTotal,
      moderationBlockedTotal,
      withImagesTotal,
    ] = await Promise.all([
      kv.get('share:analytics:created:total'),
      kv.get('share:analytics:created:last'),
      kv.get('share:analytics:viewed:total'),
      kv.get('share:analytics:viewed:last'),
      kv.get('share:analytics:rate_limited:total'),
      kv.get('share:analytics:moderation_blocked:total'),
      kv.get('share:analytics:created:with_images'),
    ]);

    // Get moderation breakdown
    const moderationCategories = [
      'hate', 'hate/threatening', 'harassment', 'harassment/threatening',
      'self-harm', 'self-harm/intent', 'self-harm/instructions',
      'sexual', 'sexual/minors', 'violence', 'violence/graphic'
    ];

    const moderationBreakdown: Record<string, number> = {};
    for (const category of moderationCategories) {
      const count = await kv.get(`share:analytics:moderation_blocked:category:${category}`);
      if (count) {
        moderationBreakdown[category] = count as number;
      }
    }

    // List all shares from Blob storage
    let shares: Array<{
      id: string;
      createdAt: string;
      size: number;
      url: string;
      views?: number;
      promptPreview?: string;
      expiresAt?: number;
    }> = [];

    try {
      const blobs = await list({ prefix: 'shares/' });

      // Get metadata and view counts for each share
      for (const blob of blobs.blobs) {
        const id = blob.pathname.replace('shares/', '').replace('.json', '');

        // Get view count
        const views = await kv.get(`share:views:${id}`) as number | null;

        // Get metadata from KV if available
        const metadata = await kv.get(`share:meta:${id}`) as ShareMetadata | null;

        shares.push({
          id,
          createdAt: blob.uploadedAt.toISOString(),
          size: blob.size,
          url: blob.url,
          views: views || 0,
          promptPreview: metadata?.promptPreview,
          expiresAt: metadata?.expiresAt,
        });
      }

      // Sort by creation date (newest first)
      shares.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to list blobs:', error);
      // Continue with empty shares array
    }

    // Calculate storage usage
    const totalStorageBytes = shares.reduce((sum, s) => sum + s.size, 0);
    const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      analytics: {
        created: {
          total: (createdTotal || 0) as number,
          withImages: (withImagesTotal || 0) as number,
          last: createdLast as string | null,
        },
        viewed: {
          total: (viewedTotal || 0) as number,
          last: viewedLast as string | null,
        },
        blocked: {
          rateLimited: (rateLimitedTotal || 0) as number,
          moderation: (moderationBlockedTotal || 0) as number,
          moderationByCategory: moderationBreakdown,
        },
      },
      storage: {
        totalShares: shares.length,
        totalSizeMB: totalStorageMB,
        totalSizeBytes: totalStorageBytes,
      },
      shares,
    });
  } catch (error) {
    console.error('Failed to fetch share admin data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share data' },
      { status: 500 }
    );
  }
}

// Delete a specific share
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get('id');

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 });
    }

    // Delete from Blob
    try {
      const blobs = await list({ prefix: `shares/${shareId}.json` });
      for (const blob of blobs.blobs) {
        await del(blob.url);
      }
    } catch (error) {
      console.error('Failed to delete blob:', error);
    }

    // Delete from KV
    try {
      await kv.del(`share:meta:${shareId}`);
      await kv.del(`share:views:${shareId}`);
    } catch (error) {
      console.error('Failed to delete KV entries:', error);
    }

    return NextResponse.json({ success: true, deleted: shareId });
  } catch (error) {
    console.error('Failed to delete share:', error);
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    );
  }
}
