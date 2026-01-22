'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  kvAvailable: boolean;
  message?: string;
  apiKeys?: {
    total: number;
    byProvider: {
      openai: number;
      anthropic: number;
      openrouter: number;
    };
    removed: number;
    lastAdded: string | null;
  };
  testing?: {
    total: number;
    successful: number;
    failed: number;
  };
  generations?: {
    successful: {
      total: number;
      byProvider: {
        openai: number;
        anthropic: number;
        openrouter: number;
      };
    };
    errors: {
      total: number;
      byProvider: {
        openai: number;
        anthropic: number;
        openrouter: number;
      };
    };
    lastGeneration: string | null;
  };
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
  error?: string;
}

export default function BackroomPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [downloadStats, setDownloadStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDownloadStats = async (authPassword: string) => {
    try {
      const response = await fetch('/api/analytics/downloads', {
        headers: {
          'Authorization': `Bearer ${authPassword}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDownloadStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch download stats');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analytics/stats', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setIsAuthenticated(true);
        // Store in sessionStorage to persist during page refreshes
        sessionStorage.setItem('backroom_password', password);
        // Also fetch download stats
        fetchDownloadStats(password);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const savedPassword = sessionStorage.getItem('backroom_password');
    if (!savedPassword) return;

    setLoading(true);
    try {
      const [statsResponse] = await Promise.all([
        fetch('/api/analytics/stats', {
          headers: {
            'Authorization': `Bearer ${savedPassword}`,
          },
        }),
        fetchDownloadStats(savedPassword),
      ]);

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to refresh stats');
    } finally {
      setLoading(false);
    }
  };

  // Check for saved password on mount
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('backroom_password');
    if (savedPassword) {
      setPassword(savedPassword);
      setIsAuthenticated(true);
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">Backroom</h1>
          <p className="text-gray-600 mb-6">Enter password to view analytics</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full"
            >
              {loading ? 'Loading...' : 'Access Backroom'}
            </button>
          </form>

          <div className="mt-6">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
              ← Back to Evvl
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats.kvAvailable) {
    return (
      <div className="w-[80%] mx-auto px-4 py-12">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
            <span>←</span> Back to Evvl
          </Link>
          <Link
            href="/backroom/api-validation"
            className="btn-primary text-sm"
          >
            API Validation
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-6 text-gray-900">Backroom Analytics</h1>

        <div className="card p-8 bg-yellow-50 border-yellow-200">
          <h2 className="text-xl font-bold mb-3 text-yellow-900">Vercel KV Not Configured</h2>
          <p className="text-yellow-800 mb-4">{stats.message}</p>
          <div className="space-y-2 text-sm text-yellow-700">
            <p><strong>To enable analytics storage:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to your Vercel dashboard</li>
              <li>Navigate to Storage → Create Database → KV</li>
              <li>Connect it to your project</li>
              <li>Redeploy your application</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const apiKeys = stats.apiKeys!;
  const testing = stats.testing!;
  const generations = stats.generations!;

  const totalGenerations = generations.successful.total + generations.errors.total;
  const successRate = totalGenerations > 0
    ? ((generations.successful.total / totalGenerations) * 100).toFixed(1)
    : '0';

  const testSuccessRate = testing.total > 0
    ? ((testing.successful / testing.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="w-[80%] mx-auto px-4 py-12">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
          <span>←</span> Back to Evvl
        </Link>
        <div className="flex gap-3">
          <Link
            href="/backroom/api-validation"
            className="btn-primary text-sm"
          >
            API Validation
          </Link>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary text-sm"
          >
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-3 text-gray-900">Backroom Analytics</h1>
      <p className="text-lg text-gray-600 mb-10">
        Anonymous usage statistics for Evvl
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Downloads */}
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Downloads</div>
          <div className="text-4xl font-bold text-purple-600">{downloadStats?.totalDownloads || 0}</div>
          <div className="text-sm text-gray-500 mt-2">
            {downloadStats?.latestVersion ? `Latest: ${downloadStats.latestVersion}` : 'No releases yet'}
          </div>
        </div>

        {/* Total API Keys Added */}
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">Total API Keys Added</div>
          <div className="text-4xl font-bold text-gray-900">{apiKeys.total}</div>
          <div className="text-sm text-gray-500 mt-2">
            Removed: {apiKeys.removed}
          </div>
        </div>

        {/* Total Generations */}
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Generations</div>
          <div className="text-4xl font-bold text-gray-900">{totalGenerations}</div>
          <div className="text-sm text-gray-500 mt-2">
            Success rate: {successRate}%
          </div>
        </div>

        {/* Total Tests */}
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">API Key Tests</div>
          <div className="text-4xl font-bold text-gray-900">{testing.total}</div>
          <div className="text-sm text-gray-500 mt-2">
            Success rate: {testSuccessRate}%
          </div>
        </div>
      </div>

      {/* Downloads by Platform */}
      {downloadStats && downloadStats.totalDownloads > 0 && (
        <div className="card p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Downloads by Platform</h2>
            <Link
              href="/backroom/downloads"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View all download data →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">macOS</div>
              <div className="text-3xl font-bold text-purple-600">{downloadStats.byPlatform.mac}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Windows</div>
              <div className="text-3xl font-bold text-blue-600">{downloadStats.byPlatform.windows}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Linux</div>
              <div className="text-3xl font-bold text-orange-600">{downloadStats.byPlatform.linux}</div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys by Provider */}
      <div className="card p-8 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">API Keys by Provider</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">OpenAI</div>
            <div className="text-3xl font-bold text-gray-900">{apiKeys.byProvider.openai}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">Anthropic</div>
            <div className="text-3xl font-bold text-gray-900">{apiKeys.byProvider.anthropic}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">OpenRouter</div>
            <div className="text-3xl font-bold text-gray-900">{apiKeys.byProvider.openrouter}</div>
          </div>
        </div>
        {apiKeys.lastAdded && (
          <div className="mt-4 text-sm text-gray-600">
            Last key added: {new Date(apiKeys.lastAdded).toLocaleString()}
          </div>
        )}
      </div>

      {/* Successful Generations by Provider */}
      <div className="card p-8 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Successful Generations by Provider</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">OpenAI</div>
            <div className="text-3xl font-bold text-green-600">{generations.successful.byProvider.openai}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">Anthropic</div>
            <div className="text-3xl font-bold text-green-600">{generations.successful.byProvider.anthropic}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">OpenRouter</div>
            <div className="text-3xl font-bold text-green-600">{generations.successful.byProvider.openrouter}</div>
          </div>
        </div>
      </div>

      {/* Generation Errors by Provider */}
      <div className="card p-8 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Generation Errors by Provider</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">OpenAI</div>
            <div className="text-3xl font-bold text-red-600">{generations.errors.byProvider.openai}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">Anthropic</div>
            <div className="text-3xl font-bold text-red-600">{generations.errors.byProvider.anthropic}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">OpenRouter</div>
            <div className="text-3xl font-bold text-red-600">{generations.errors.byProvider.openrouter}</div>
          </div>
        </div>
        {generations.lastGeneration && (
          <div className="mt-4 text-sm text-gray-600">
            Last generation: {new Date(generations.lastGeneration).toLocaleString()}
          </div>
        )}
      </div>

      {/* Privacy Note */}
      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">Privacy Note</h3>
        <p className="text-sm text-blue-800">
          All analytics are completely anonymous. No API keys, prompts, or responses are stored.
          Only event counts and provider/model names are tracked.
        </p>
      </div>
    </div>
  );
}
