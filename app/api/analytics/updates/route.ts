/**
 * Update Analytics API
 *
 * Returns statistics about Tauri update checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const BACKROOM_PASSWORD = process.env.BACKROOM_PASSWORD || 'evvl-admin-2024';

interface DailyStats {
  date: string;
  total: number;
  byPlatform: Record<string, number>;
  byVersion: Record<string, number>;
  byArch: Record<string, number>;
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

    // Get all-time totals
    const totals = await kv.hgetall<Record<string, number>>('updates:totals') || {};

    // Parse totals into structured format
    const totalChecks = totals.total || 0;
    const byPlatform: Record<string, number> = {};
    const byVersion: Record<string, number> = {};

    for (const [key, value] of Object.entries(totals)) {
      if (key.startsWith('platform:')) {
        byPlatform[key.replace('platform:', '')] = value;
      } else if (key.startsWith('version:')) {
        byVersion[key.replace('version:', '')] = value;
      }
    }

    // Get daily history
    const dates = await kv.zrange('updates:daily:dates', -days, -1) as string[];
    const history: DailyStats[] = [];

    for (const date of dates || []) {
      const dailyData = await kv.hgetall<Record<string, number>>(`updates:daily:${date}`) || {};

      const dayStats: DailyStats = {
        date,
        total: dailyData.total || 0,
        byPlatform: {},
        byVersion: {},
        byArch: {},
      };

      for (const [key, value] of Object.entries(dailyData)) {
        if (key.startsWith('platform:')) {
          dayStats.byPlatform[key.replace('platform:', '')] = value;
        } else if (key.startsWith('version:')) {
          dayStats.byVersion[key.replace('version:', '')] = value;
        } else if (key.startsWith('arch:')) {
          dayStats.byArch[key.replace('arch:', '')] = value;
        }
      }

      history.push(dayStats);
    }

    // Sort by date ascending
    history.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate period stats
    const periodTotal = history.reduce((sum, day) => sum + day.total, 0);
    const avgDaily = history.length > 0 ? Math.round(periodTotal / history.length) : 0;

    return NextResponse.json({
      totals: {
        total: totalChecks,
        byPlatform,
        byVersion,
      },
      history,
      summary: {
        totalDays: history.length,
        periodTotal,
        avgDaily,
      },
    });
  } catch (error) {
    console.error('Failed to fetch update analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch update analytics' },
      { status: 500 }
    );
  }
}
