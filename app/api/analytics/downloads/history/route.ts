/**
 * Download History API
 *
 * Returns daily download snapshots for charting
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const BACKROOM_PASSWORD = process.env.BACKROOM_PASSWORD || 'evvl-admin-2024';

interface DailySnapshot {
  date: string;
  total: number;
  mac: number;
  windows: number;
  linux: number;
  dailyTotal: number;
  dailyMac: number;
  dailyWindows: number;
  dailyLinux: number;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  // Check authorization
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token !== BACKROOM_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get number of days from query param (default 30)
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90);

    // Get dates from sorted set (most recent first)
    const dates = await kv.zrange('downloads:daily:dates', -days, -1) as string[];

    if (!dates || dates.length === 0) {
      return NextResponse.json({
        history: [],
        summary: {
          totalDays: 0,
          totalDownloads: 0,
          avgDaily: 0,
          byPlatform: { mac: 0, windows: 0, linux: 0 },
        },
      });
    }

    // Fetch all snapshots for these dates
    const snapshots: DailySnapshot[] = [];
    for (const date of dates) {
      const snapshot = await kv.get<DailySnapshot>(`downloads:daily:${date}`);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }

    // Sort by date ascending for charting
    snapshots.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate summary stats
    const totalDailyDownloads = snapshots.reduce((sum, s) => sum + s.dailyTotal, 0);
    const totalDailyMac = snapshots.reduce((sum, s) => sum + s.dailyMac, 0);
    const totalDailyWindows = snapshots.reduce((sum, s) => sum + s.dailyWindows, 0);
    const totalDailyLinux = snapshots.reduce((sum, s) => sum + s.dailyLinux, 0);

    return NextResponse.json({
      history: snapshots,
      summary: {
        totalDays: snapshots.length,
        totalDownloads: totalDailyDownloads,
        avgDaily: snapshots.length > 0 ? Math.round(totalDailyDownloads / snapshots.length) : 0,
        byPlatform: {
          mac: totalDailyMac,
          windows: totalDailyWindows,
          linux: totalDailyLinux,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch download history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download history' },
      { status: 500 }
    );
  }
}
