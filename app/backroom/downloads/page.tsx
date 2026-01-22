'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  error?: string;
}

export default function DownloadsPage() {
  const [downloadStats, setDownloadStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const savedPassword = sessionStorage.getItem('backroom_password');
      if (!savedPassword) {
        setError('Not authenticated. Please log in from the main backroom page.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/analytics/downloads', {
          headers: {
            'Authorization': `Bearer ${savedPassword}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDownloadStats(data);
        } else if (response.status === 401) {
          setError('Not authenticated. Please log in from the main backroom page.');
        } else {
          setError('Failed to fetch download stats');
        }
      } catch (err) {
        setError('Failed to fetch download stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[80%] mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/backroom" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
            <span>←</span> Back to Backroom
          </Link>
        </div>
        <div className="card p-8 bg-red-50 border-red-200">
          <h2 className="text-xl font-bold mb-3 text-red-900">Error</h2>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!downloadStats) {
    return null;
  }

  // Calculate platform percentages
  const totalPlatformDownloads = downloadStats.byPlatform.mac + downloadStats.byPlatform.windows + downloadStats.byPlatform.linux;
  const macPercent = totalPlatformDownloads > 0 ? ((downloadStats.byPlatform.mac / totalPlatformDownloads) * 100).toFixed(1) : '0';
  const windowsPercent = totalPlatformDownloads > 0 ? ((downloadStats.byPlatform.windows / totalPlatformDownloads) * 100).toFixed(1) : '0';
  const linuxPercent = totalPlatformDownloads > 0 ? ((downloadStats.byPlatform.linux / totalPlatformDownloads) * 100).toFixed(1) : '0';

  return (
    <div className="w-[80%] mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-6">
        <Link href="/backroom" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
          <span>←</span> Back to Backroom
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-3 text-gray-900">Download Analytics</h1>
      <p className="text-lg text-gray-600 mb-10">
        Detailed download statistics from GitHub releases
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Downloads</div>
          <div className="text-4xl font-bold text-purple-600">{downloadStats.totalDownloads}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Releases</div>
          <div className="text-4xl font-bold text-gray-900">{downloadStats.byRelease.length}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">Latest Version</div>
          <div className="text-4xl font-bold text-blue-600">{downloadStats.latestVersion || 'N/A'}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">Avg per Release</div>
          <div className="text-4xl font-bold text-green-600">
            {downloadStats.byRelease.length > 0
              ? Math.round(downloadStats.totalDownloads / downloadStats.byRelease.length)
              : 0}
          </div>
        </div>
      </div>

      {/* Downloads by Platform - Detailed */}
      <div className="card p-8 mb-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Downloads by Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-6xl mb-2">🍎</div>
            <div className="text-sm font-medium text-gray-600 mb-1">macOS</div>
            <div className="text-4xl font-bold text-purple-600">{downloadStats.byPlatform.mac}</div>
            <div className="text-sm text-gray-500 mt-1">{macPercent}% of total</div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full"
                style={{ width: `${macPercent}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-6xl mb-2">🪟</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Windows</div>
            <div className="text-4xl font-bold text-blue-600">{downloadStats.byPlatform.windows}</div>
            <div className="text-sm text-gray-500 mt-1">{windowsPercent}% of total</div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${windowsPercent}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-6xl mb-2">🐧</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Linux</div>
            <div className="text-4xl font-bold text-orange-600">{downloadStats.byPlatform.linux}</div>
            <div className="text-sm text-gray-500 mt-1">{linuxPercent}% of total</div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-600 rounded-full"
                style={{ width: `${linuxPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* All Releases Table */}
      <div className="card p-8 mb-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">All Releases</h2>
        {downloadStats.byRelease.length === 0 ? (
          <p className="text-gray-500">No releases found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Version</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Release Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">macOS</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Windows</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Linux</th>
                </tr>
              </thead>
              <tbody>
                {downloadStats.byRelease.map((release, index) => {
                  const macDownloads = release.assets.filter(a => a.platform === 'mac').reduce((sum, a) => sum + a.downloads, 0);
                  const windowsDownloads = release.assets.filter(a => a.platform === 'windows').reduce((sum, a) => sum + a.downloads, 0);
                  const linuxDownloads = release.assets.filter(a => a.platform === 'linux').reduce((sum, a) => sum + a.downloads, 0);

                  return (
                    <tr
                      key={release.version}
                      className={`border-b border-gray-100 ${index === 0 ? 'bg-purple-50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{release.version}</span>
                        {index === 0 && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                            Latest
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(release.publishedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {release.downloads}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-600">
                        {macDownloads}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600">
                        {windowsDownloads}
                      </td>
                      <td className="py-3 px-4 text-right text-orange-600">
                        {linuxDownloads}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-900">Total</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    {downloadStats.totalDownloads}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-purple-600">
                    {downloadStats.byPlatform.mac}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600">
                    {downloadStats.byPlatform.windows}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-orange-600">
                    {downloadStats.byPlatform.linux}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Individual Assets */}
      <div className="card p-8 mb-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">All Assets</h2>
        {downloadStats.byRelease.length === 0 ? (
          <p className="text-gray-500">No assets found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Filename</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Version</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Platform</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Downloads</th>
                </tr>
              </thead>
              <tbody>
                {downloadStats.byRelease.flatMap((release) =>
                  release.assets.map((asset) => (
                    <tr key={`${release.version}-${asset.name}`} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-gray-700">{asset.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{release.version}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          asset.platform === 'mac' ? 'bg-purple-100 text-purple-700' :
                          asset.platform === 'windows' ? 'bg-blue-100 text-blue-700' :
                          asset.platform === 'linux' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {asset.platform}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {asset.downloads}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note about daily stats */}
      <div className="card p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-bold text-yellow-900 mb-2">Note on Daily Statistics</h3>
        <p className="text-sm text-yellow-800">
          GitHub's API only provides total download counts, not daily breakdowns.
          To track downloads per day, we would need to periodically snapshot the counts
          and calculate the differences. This feature can be added if needed.
        </p>
      </div>
    </div>
  );
}
