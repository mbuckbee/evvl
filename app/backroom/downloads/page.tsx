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
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-50 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" viewBox="0 0 384 512" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
            </div>
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
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" viewBox="0 0 448 512" fill="currentColor">
                <path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/>
              </svg>
            </div>
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
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-600" viewBox="0 0 448 512" fill="currentColor">
                <path d="M220.8 123.3c1 .5 1.8 1.7 3 1.7 1.1 0 2.8-.4 2.9-1.5.2-1.4-1.9-2.3-3.2-2.9-1.7-.7-3.9-1-5.5-.1-.4.2-.8.7-.6 1.1.3 1.3 2.3 1.1 3.4 1.7zm-21.9 1.7c1.2 0 2-1.2 3-1.7 1.1-.6 3.1-.4 3.5-1.6.2-.4-.2-.9-.6-1.1-1.6-.9-3.8-.6-5.5.1-1.3.6-3.4 1.5-3.2 2.9.1 1 1.8 1.5 2.8 1.4zM420 403.8c-3.6-4-5.3-11.6-7.2-19.7-1.8-8.1-3.9-16.8-10.5-22.4-1.3-1.1-2.6-2.1-4-2.9-1.3-.8-2.7-1.5-4.1-2 9.2-27.3 5.6-54.5-3.7-79.1-11.4-30.1-31.3-56.4-46.5-74.4-17.1-21.5-33.7-41.9-33.4-72C311.1 85.4 315.7.1 234.8 0 132.4-.2 158 103.4 156.9 135.2c-1.7 23.4-6.4 41.8-22.5 64.7-18.9 22.5-45.5 58.8-58.1 96.7-6 17.9-8.8 36.1-6.2 53.3-6.5 5.8-11.4 14.7-16.6 20.2-4.2 4.3-10.3 5.9-17 8.3s-14 6-18.5 14.5c-2.1 3.9-2.8 8.1-2.8 12.4 0 3.9.6 7.9 1.2 11.8 1.2 8.1 2.5 15.7.8 20.8-5.2 14.4-5.9 24.4-2.2 31.7 3.8 7.3 11.4 10.5 20.1 12.3 17.3 3.6 40.8 2.7 59.3 12.5 19.8 10.4 39.9 14.1 55.9 10.4 11.6-2.6 21.1-9.6 25.9-20.2 12.5-.1 26.3-5.4 48.3-6.6 14.9-1.2 33.6 5.3 55.1 4.1.6 2.3 1.4 4.6 2.5 6.7v.1c8.3 16.7 23.8 24.3 40.3 23 16.6-1.3 34.1-11 48.3-27.9 13.6-16.4 36-23.2 50.9-32.2 7.4-4.5 13.4-10.1 13.9-18.3.4-8.2-4.4-17.3-15.5-29.7zM223.7 87.3c9.8-22.2 34.2-21.8 44-.4 6.5 14.2 3.6 30.9-4.3 40.4-1.6-.8-5.9-2.6-12.6-4.9 1.1-1.2 3.1-2.7 3.9-4.6 4.8-11.8-.2-27-9.1-27.3-7.3-.5-13.9 10.8-11.8 23-4.1-2-9.4-3.5-13-4.4-1-6.9-.3-14.6 2.9-21.8zM183 75.8c10.1 0 20.8 14.2 19.1 33.5-3.5 1-7.1 2.5-10.2 4.6 1.2-8.9-3.3-20.1-9.6-19.6-8.4.7-9.8 21.2-1.8 28.1 1 .8 1.9-.2-5.9 5.5-15.6-14.6-10.5-52.1 8.4-52.1zm-13.6 60.7c6.2-4.6 13.6-10 14.1-10.5 4.7-4.4 13.5-14.2 27.9-14.2 7.1 0 15.6 2.3 25.9 8.9 6.3 4.1 11.3 4.4 22.6 9.3 8.4 3.5 13.7 9.7 10.5 18.2-2.6 7.1-11 14.4-22.7 18.1-11.1 3.6-19.8 16-38.2 14.9-3.9-.2-7-1-9.6-2.1-8-3.5-12.2-10.4-20-15-8.6-4.8-13.2-10.4-14.7-15.3-1.4-4.9 0-9 4.2-12.3zm3.3 334c-2.7 35.1-43.9 34.4-75.3 18-29.9-15.8-68.6-6.5-76.5-21.9-2.4-4.7-2.4-12.7 2.6-26.4v-.2c2.4-7.6.6-16-.6-23.9-1.2-7.8-1.8-15 .9-20 3.5-6.7 8.5-9.1 14.8-11.3 10.3-3.7 11.8-3.4 19.6-9.9 5.5-5.7 9.5-12.9 14.3-18 5.1-5.5 10-8.1 17.7-6.9 8.1 1.2 15.1 6.8 21.9 16l19.6 35.6c9.5 19.9 43.1 48.4 41 68.9zm-30.5-117.6c-3.7-10.5-11.3-18.8-18.5-25.4-.1 0-.1 0-.1-.1 0-.1 0-.2-.1-.3-17.9-17.1-50.3-42.3-51-80.3-.1-22.9 13.7-47 42.1-68.2 4.9-3.6 10.3-7.2 16.5-10.6 7.7 18.5 8.5 51.4-1 64.7-5.4 7.6-11.5 12.4-13.3 17.4 2 9.6 15.6 21.9 20 24.8 1.2.7 2.4.9 3.6.6.7-.1 1.4-.5 1.9-1 .6-.5 1-1.2 1.2-2 .8-2.7-.1-5.6-2.9-8.3-3.5-3.4-8.4-6.3-11.3-9.2-2.7-2.6-4.5-5.4-3.8-8.5 1-4.1 6.4-7.8 10.4-9.4 3.1-1.2 4.9-1.2 8.2.6 11.5 6.4 10.5 24.3 4.2 35.6 5 4.6 10.2 8.4 17.3 13.4 13.1 9.1 18.5 34.1-2.2 53.3-.3.2-5.2 4.6-8.3 6.3zm49.8 63.8c-4.9-14.9-8.3-39.7-8.6-49.5-.2-10.1-.6-24.3 3.7-33.8 3.5-7.6 10.7-13 20.7-17.1 8.4-3.5 20.5-6.4 31.1-5.7 2.8 6.7 3.5 13.5 3.1 20.5-.8 13.8-5.2 27.5-11.2 38.7-1.9 3.7-4.3 7.5-6.7 11.4-5.5 8.9-10.4 17.4-12.5 27.8-1.5 7.5-5.3 14.5-4.7 21.5-6.2 5.2-11.6 4.4-14.9-13.8zm40.2-33.3c3.8-7.5 6.2-14.7 7.3-22.6.6 3.1.6 6.3.5 9.6-.5 9.4-3.1 17.3-6.2 25 .1-3.8-.4-7.8-1.6-12zm115.3 37.3c-6.6 14.3-19.6 22.4-29.5 26.5-20.1 8.3-40.7 13.8-56.6 26.8-.5.4-.9.8-1.4 1.2-1.1.9-2.6-1-1.9-2.1.7-1.1 1.5-2.2 2.3-3.3 1.6-2.3 3.4-4.4 5.2-6.4 3.3-3.7 6.8-7.2 10.6-10.5 2-1.8 4.1-3.5 6.3-5.2 7.2-5.5 15.3-10.4 25.5-15.5 3.4-1.8 6.9-3.3 10.5-4.7 2.1-.8 4.3-1.6 6.3-2.5 4.2-1.9 8.2-4.1 11.4-7 5.5-5 8.9-12.5 9.4-21.4.2-3.5-.3-7-.9-10.5-1.5-8.6-4.1-16.4-3.7-25.8.3-8.3 3.6-17.3 9.3-25.7 5.7-8.3 10.7-17.1 13.6-25.4 3.1-8.9 4.1-17.4 2.2-24.1-.4-1.5-.8-3.2-1.4-4.8 4.5 6.3 5.9 15.6 4.9 26.3-2 22.1-15.2 42.3-16.9 61.2-1.6 18.4.9 25.3 3.6 32 2.8 6.8 5 13.2 5.5 19.1 1 14.2-3.8 24.2-14.3 32.6z"/>
              </svg>
            </div>
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
