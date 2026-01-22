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

interface DownloadHistory {
  history: DailySnapshot[];
  summary: {
    totalDays: number;
    totalDownloads: number;
    avgDaily: number;
    byPlatform: {
      mac: number;
      windows: number;
      linux: number;
    };
  };
}

export default function DownloadsPage() {
  const [downloadStats, setDownloadStats] = useState<DownloadStats | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory | null>(null);
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
        // Fetch both current stats and daily history in parallel
        const [statsResponse, historyResponse] = await Promise.all([
          fetch('/api/analytics/downloads', {
            headers: {
              'Authorization': `Bearer ${savedPassword}`,
            },
          }),
          fetch('/api/analytics/downloads/history?days=30', {
            headers: {
              'Authorization': `Bearer ${savedPassword}`,
            },
          }),
        ]);

        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setDownloadStats(data);
        } else if (statsResponse.status === 401) {
          setError('Not authenticated. Please log in from the main backroom page.');
          setLoading(false);
          return;
        } else {
          setError('Failed to fetch download stats');
        }

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setDownloadHistory(historyData);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

      {/* Daily Downloads Chart */}
      {downloadHistory && downloadHistory.history.length > 0 && (
        <div className="card p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Daily Downloads (Last 30 Days)</h2>

          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Days Tracked</div>
              <div className="text-2xl font-bold text-gray-900">{downloadHistory.summary.totalDays}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Period Downloads</div>
              <div className="text-2xl font-bold text-purple-600">{downloadHistory.summary.totalDownloads}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Avg per Day</div>
              <div className="text-2xl font-bold text-blue-600">{downloadHistory.summary.avgDaily}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Best Day</div>
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...downloadHistory.history.map(d => d.dailyTotal))}
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="relative">
            <div className="flex items-end justify-between gap-1 h-48 border-b border-gray-200">
              {downloadHistory.history.map((day, index) => {
                const maxDaily = Math.max(...downloadHistory.history.map(d => d.dailyTotal), 1);
                const totalHeight = (day.dailyTotal / maxDaily) * 100;
                const macHeight = (day.dailyMac / maxDaily) * 100;
                const windowsHeight = (day.dailyWindows / maxDaily) * 100;
                const linuxHeight = (day.dailyLinux / maxDaily) * 100;

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end group relative"
                  >
                    {/* Stacked bar */}
                    <div className="w-full flex flex-col items-center justify-end">
                      {day.dailyLinux > 0 && (
                        <div
                          className="w-full max-w-[20px] bg-orange-500 rounded-t-sm"
                          style={{ height: `${linuxHeight}%` }}
                        />
                      )}
                      {day.dailyWindows > 0 && (
                        <div
                          className="w-full max-w-[20px] bg-blue-500"
                          style={{ height: `${windowsHeight}%` }}
                        />
                      )}
                      {day.dailyMac > 0 && (
                        <div
                          className="w-full max-w-[20px] bg-purple-500"
                          style={{ height: `${macHeight}%` }}
                        />
                      )}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        <div className="font-semibold">{new Date(day.date).toLocaleDateString()}</div>
                        <div>Total: {day.dailyTotal}</div>
                        <div className="text-purple-300">Mac: {day.dailyMac}</div>
                        <div className="text-blue-300">Win: {day.dailyWindows}</div>
                        <div className="text-orange-300">Linux: {day.dailyLinux}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels (show every 5th date) */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {downloadHistory.history.filter((_, i) => i % 5 === 0 || i === downloadHistory.history.length - 1).map((day) => (
                <div key={day.date}>
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-gray-600">macOS ({downloadHistory.summary.byPlatform.mac})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-600">Windows ({downloadHistory.summary.byPlatform.windows})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded" />
              <span className="text-gray-600">Linux ({downloadHistory.summary.byPlatform.linux})</span>
            </div>
          </div>
        </div>
      )}

      {/* Daily Downloads Table */}
      {downloadHistory && downloadHistory.history.length > 0 && (
        <div className="card p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Daily Download History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Daily Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">macOS</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Windows</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Linux</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {[...downloadHistory.history].reverse().map((day, index) => (
                  <tr
                    key={day.date}
                    className={`border-b border-gray-100 ${index === 0 ? 'bg-green-50' : ''}`}
                  >
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                      {index === 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          Latest
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{day.dailyTotal}</td>
                    <td className="py-3 px-4 text-right text-purple-600">{day.dailyMac}</td>
                    <td className="py-3 px-4 text-right text-blue-600">{day.dailyWindows}</td>
                    <td className="py-3 px-4 text-right text-orange-600">{day.dailyLinux}</td>
                    <td className="py-3 px-4 text-right text-gray-500">{day.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-900">Total (Period)</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    {downloadHistory.summary.totalDownloads}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-purple-600">
                    {downloadHistory.summary.byPlatform.mac}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600">
                    {downloadHistory.summary.byPlatform.windows}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-orange-600">
                    {downloadHistory.summary.byPlatform.linux}
                  </td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Note if no daily history yet */}
      {(!downloadHistory || downloadHistory.history.length === 0) && (
        <div className="card p-6 bg-blue-50 border-blue-200 mb-6">
          <h3 className="font-bold text-blue-900 mb-2">Daily Tracking Active</h3>
          <p className="text-sm text-blue-800">
            Daily download snapshots are now being collected automatically at midnight UTC.
            Once data is available, you&apos;ll see daily download charts and trends here.
          </p>
        </div>
      )}
    </div>
  );
}
