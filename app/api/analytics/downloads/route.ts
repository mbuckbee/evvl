/**
 * GitHub Release Downloads API
 *
 * Fetches download statistics from the evvl-releases repo
 */

import { NextRequest, NextResponse } from 'next/server';

const GITHUB_REPO = 'mbuckbee/evvl-releases';
const BACKROOM_PASSWORD = process.env.BACKROOM_PASSWORD || 'evvl-admin-2024';

interface ReleaseAsset {
  name: string;
  download_count: number;
  size: number;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  assets: ReleaseAsset[];
}

interface DownloadStats {
  totalDownloads: number;
  byPlatform: {
    mac: number;
    windows: number;
    linux: number;
  };
  byRelease: {
    version: string;
    name: string;
    publishedAt: string;
    downloads: number;
    assets: {
      name: string;
      downloads: number;
      platform: 'mac' | 'windows' | 'linux' | 'other';
    }[];
  }[];
  latestVersion: string | null;
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
  // Check authorization
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token !== BACKROOM_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch releases from GitHub API (no auth needed for public repos)
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Evvl-Backroom',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          totalDownloads: 0,
          byPlatform: { mac: 0, windows: 0, linux: 0 },
          byRelease: [],
          latestVersion: null,
          error: 'Repository not found or no releases yet',
        });
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const releases: Release[] = await response.json();

    // Calculate stats
    let totalDownloads = 0;
    const byPlatform = { mac: 0, windows: 0, linux: 0 };

    const byRelease = releases.map((release) => {
      let releaseDownloads = 0;
      const assets = release.assets.map((asset) => {
        const platform = detectPlatform(asset.name);
        releaseDownloads += asset.download_count;
        totalDownloads += asset.download_count;

        if (platform === 'mac') byPlatform.mac += asset.download_count;
        if (platform === 'windows') byPlatform.windows += asset.download_count;
        if (platform === 'linux') byPlatform.linux += asset.download_count;

        return {
          name: asset.name,
          downloads: asset.download_count,
          platform,
        };
      });

      return {
        version: release.tag_name,
        name: release.name || release.tag_name,
        publishedAt: release.published_at,
        downloads: releaseDownloads,
        assets,
      };
    });

    const stats: DownloadStats = {
      totalDownloads,
      byPlatform,
      byRelease,
      latestVersion: releases.length > 0 ? releases[0].tag_name : null,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch GitHub release stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download stats' },
      { status: 500 }
    );
  }
}
