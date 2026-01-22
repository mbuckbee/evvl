/**
 * Update Check Endpoint
 *
 * Proxies Tauri update checks to GitHub while logging analytics.
 * Tracks which versions are checking for updates and from which platforms.
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const GITHUB_LATEST_JSON = 'https://github.com/mbuckbee/evvl-releases/releases/latest/download/latest.json';

// Cache the GitHub response for 5 minutes to reduce load
let cachedResponse: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function logUpdateCheck(request: NextRequest) {
  try {
    // Tauri sends these headers with update checks
    const currentVersion = request.headers.get('x-tauri-current-version') || 'unknown';
    const platform = request.headers.get('x-tauri-target') || 'unknown';
    const arch = request.headers.get('x-tauri-arch') || 'unknown';

    const today = new Date().toISOString().split('T')[0];

    // Increment daily counter
    await kv.hincrby(`updates:daily:${today}`, 'total', 1);
    await kv.hincrby(`updates:daily:${today}`, `platform:${platform}`, 1);
    await kv.hincrby(`updates:daily:${today}`, `version:${currentVersion}`, 1);
    await kv.hincrby(`updates:daily:${today}`, `arch:${arch}`, 1);

    // Increment all-time counters
    await kv.hincrby('updates:totals', 'total', 1);
    await kv.hincrby('updates:totals', `platform:${platform}`, 1);
    await kv.hincrby('updates:totals', `version:${currentVersion}`, 1);

    // Track active dates for history queries
    const timestamp = new Date(today).getTime();
    await kv.zadd('updates:daily:dates', { score: timestamp, member: today });

    // Keep only last 90 days
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    await kv.zremrangebyscore('updates:daily:dates', 0, ninetyDaysAgo);

    console.log(`[UPDATE CHECK] version=${currentVersion} platform=${platform} arch=${arch}`);
  } catch (error) {
    // Don't fail the update check if logging fails
    console.error('[UPDATE CHECK] Failed to log:', error);
  }
}

export async function GET(request: NextRequest) {
  // Log the update check asynchronously (don't block the response)
  logUpdateCheck(request);

  try {
    // Check cache first
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResponse.data);
    }

    // Fetch from GitHub
    const response = await fetch(GITHUB_LATEST_JSON, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Evvl-Update-Proxy',
      },
    });

    if (!response.ok) {
      // If no update available (404), return empty response
      if (response.status === 404) {
        return new NextResponse(null, { status: 204 });
      }
      throw new Error(`GitHub returned ${response.status}`);
    }

    const data = await response.json();

    // Cache the response
    cachedResponse = { data, timestamp: Date.now() };

    return NextResponse.json(data);
  } catch (error) {
    console.error('[UPDATE CHECK] Failed to fetch from GitHub:', error);

    // Return cached data if available, even if stale
    if (cachedResponse) {
      return NextResponse.json(cachedResponse.data);
    }

    // No update available
    return new NextResponse(null, { status: 204 });
  }
}
