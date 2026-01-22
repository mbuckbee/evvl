/**
 * Daily Download Snapshot Cron Job
 *
 * Runs daily to snapshot GitHub release download counts.
 * Stores the daily totals in Vercel KV for historical tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const GITHUB_REPO = 'mbuckbee/evvl-releases';

interface ReleaseAsset {
  name: string;
  download_count: number;
}

interface Release {
  tag_name: string;
  assets: ReleaseAsset[];
}

function detectPlatform(filename: string): 'mac' | 'windows' | 'linux' | 'other' {
  const lower = filename.toLowerCase();
  if (lower.includes('.dmg') || lower.includes('darwin') || lower.includes('macos') || lower.includes('.app')) {
    return 'mac';
  }
  if (lower.includes('.exe') || lower.includes('.msi') || lower.includes('windows') || lower.includes('win')) {
    return 'windows';
  }
  if (lower.includes('.deb') || lower.includes('.rpm') || lower.includes('.appimage') || lower.includes('linux')) {
    return 'linux';
  }
  return 'other';
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security (Vercel adds this header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow if CRON_SECRET matches OR if called from Vercel Cron (has special header)
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !hasValidSecret) {
    // In development, allow without auth
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Fetch current download counts from GitHub
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Evvl-Cron',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const releases: Release[] = await response.json();

    // Calculate totals
    let totalDownloads = 0;
    const byPlatform = { mac: 0, windows: 0, linux: 0 };

    for (const release of releases) {
      for (const asset of release.assets) {
        const platform = detectPlatform(asset.name);
        totalDownloads += asset.download_count;

        if (platform === 'mac') byPlatform.mac += asset.download_count;
        if (platform === 'windows') byPlatform.windows += asset.download_count;
        if (platform === 'linux') byPlatform.linux += asset.download_count;
      }
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get yesterday's totals to calculate daily delta
    const yesterdayTotal = await kv.get<number>('downloads:snapshot:latest:total') || 0;
    const yesterdayMac = await kv.get<number>('downloads:snapshot:latest:mac') || 0;
    const yesterdayWindows = await kv.get<number>('downloads:snapshot:latest:windows') || 0;
    const yesterdayLinux = await kv.get<number>('downloads:snapshot:latest:linux') || 0;

    // Calculate daily downloads (delta from yesterday)
    const dailyTotal = totalDownloads - yesterdayTotal;
    const dailyMac = byPlatform.mac - yesterdayMac;
    const dailyWindows = byPlatform.windows - yesterdayWindows;
    const dailyLinux = byPlatform.linux - yesterdayLinux;

    // Store today's snapshot
    const snapshot = {
      date: today,
      total: totalDownloads,
      mac: byPlatform.mac,
      windows: byPlatform.windows,
      linux: byPlatform.linux,
      dailyTotal: Math.max(0, dailyTotal), // Ensure non-negative
      dailyMac: Math.max(0, dailyMac),
      dailyWindows: Math.max(0, dailyWindows),
      dailyLinux: Math.max(0, dailyLinux),
      timestamp: new Date().toISOString(),
    };

    // Store daily snapshot with date key
    await kv.set(`downloads:daily:${today}`, snapshot);

    // Update latest totals for next day's delta calculation
    await kv.set('downloads:snapshot:latest:total', totalDownloads);
    await kv.set('downloads:snapshot:latest:mac', byPlatform.mac);
    await kv.set('downloads:snapshot:latest:windows', byPlatform.windows);
    await kv.set('downloads:snapshot:latest:linux', byPlatform.linux);
    await kv.set('downloads:snapshot:latest:date', today);

    // Add to sorted set for easy date range queries (score = unix timestamp)
    const timestamp = new Date(today).getTime();
    await kv.zadd('downloads:daily:dates', { score: timestamp, member: today });

    // Keep only last 90 days of detailed data
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    await kv.zremrangebyscore('downloads:daily:dates', 0, ninetyDaysAgo);

    console.log(`[CRON] Download snapshot saved for ${today}:`, snapshot);

    return NextResponse.json({
      success: true,
      date: today,
      snapshot,
    });
  } catch (error) {
    console.error('[CRON] Failed to snapshot downloads:', error);
    return NextResponse.json(
      { error: 'Failed to snapshot downloads' },
      { status: 500 }
    );
  }
}
