// Share storage helpers using Vercel Blob and KV

import { put, del, head } from '@vercel/blob';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import type { SharedEvaluation, ShareMetadata } from './share-types';

const SHARE_EXPIRY_DAYS = 7;
const RATE_LIMIT_PER_DAY = 5;

/**
 * Generate a unique share ID
 */
export function generateShareId(): string {
  return nanoid(10); // 10 character ID like "V1StGXR8_Z"
}

/**
 * Calculate expiry timestamp (7 days from now)
 */
export function getExpiryTimestamp(): number {
  return Date.now() + (SHARE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Get the rate limit key for an IP (resets daily)
 */
function getRateLimitKey(ip: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `share:ratelimit:${ip}:${today}`;
}

/**
 * Check if an IP has exceeded the daily rate limit
 */
export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const key = getRateLimitKey(ip);
    const count = await kv.get<number>(key) || 0;

    if (count >= RATE_LIMIT_PER_DAY) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: RATE_LIMIT_PER_DAY - count };
  } catch (error) {
    // If KV is unavailable, allow the request
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: RATE_LIMIT_PER_DAY };
  }
}

/**
 * Increment the rate limit counter for an IP
 */
export async function incrementRateLimit(ip: string): Promise<void> {
  try {
    const key = getRateLimitKey(ip);
    await kv.incr(key);
    // Set expiry to end of day (24 hours from first request)
    await kv.expire(key, 24 * 60 * 60);
  } catch (error) {
    console.error('Rate limit increment failed:', error);
  }
}

/**
 * Save a share to Vercel Blob and record metadata in KV
 */
export async function saveShare(share: SharedEvaluation): Promise<string> {
  const blobPath = `shares/${share.id}.json`;

  // Upload to Vercel Blob
  const blob = await put(blobPath, JSON.stringify(share), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false
  });

  // Store metadata in KV for quick lookups
  const metadata: ShareMetadata = {
    id: share.id,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
    blobUrl: blob.url,
    promptPreview: share.prompt.content.substring(0, 100)
  };

  try {
    await kv.set(`share:meta:${share.id}`, metadata);
    // Set TTL to match expiry
    const ttlSeconds = Math.floor((share.expiresAt - Date.now()) / 1000);
    if (ttlSeconds > 0) {
      await kv.expire(`share:meta:${share.id}`, ttlSeconds);
    }
  } catch (error) {
    console.error('Failed to store share metadata in KV:', error);
    // Continue anyway - blob is the source of truth
  }

  return blob.url;
}

/**
 * Get a share by ID
 */
export async function getShare(id: string): Promise<SharedEvaluation | null> {
  try {
    // First check KV for metadata (fast path)
    const metadata = await kv.get<ShareMetadata>(`share:meta:${id}`);

    if (metadata) {
      // Check if expired
      if (metadata.expiresAt < Date.now()) {
        // Lazy cleanup - delete expired share
        await deleteShare(id, metadata.blobUrl);
        return null;
      }

      // Fetch from blob
      const response = await fetch(metadata.blobUrl);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    }

    // Fallback: try to fetch directly from blob (KV might not have it)
    // This handles the case where KV was unavailable when saving
    const blobUrl = `${process.env.BLOB_READ_WRITE_TOKEN ? 'https://' : ''}shares/${id}.json`;

    // Use head to check if blob exists
    try {
      const blobInfo = await head(`shares/${id}.json`);
      if (blobInfo) {
        const response = await fetch(blobInfo.url);
        if (response.ok) {
          const share: SharedEvaluation = await response.json();
          // Check expiry
          if (share.expiresAt < Date.now()) {
            await deleteShare(id, blobInfo.url);
            return null;
          }
          return share;
        }
      }
    } catch {
      // Blob doesn't exist
    }

    return null;
  } catch (error) {
    console.error('Failed to get share:', error);
    return null;
  }
}

/**
 * Delete a share
 */
export async function deleteShare(id: string, blobUrl?: string): Promise<void> {
  try {
    // Delete from KV
    await kv.del(`share:meta:${id}`);
  } catch (error) {
    console.error('Failed to delete share metadata from KV:', error);
  }

  try {
    // Delete from Blob
    if (blobUrl) {
      await del(blobUrl);
    } else {
      // Try to find and delete
      const blobInfo = await head(`shares/${id}.json`);
      if (blobInfo) {
        await del(blobInfo.url);
      }
    }
  } catch (error) {
    console.error('Failed to delete share from Blob:', error);
  }
}

/**
 * Get the client's IP address from request headers
 */
export function getClientIP(request: Request): string {
  // Vercel provides the real IP in this header
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}
