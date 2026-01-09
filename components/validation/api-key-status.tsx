/**
 * API Key Status Component
 *
 * Displays which API keys are configured in localStorage
 */

'use client';

import Link from 'next/link';
import { ApiKeys, Provider } from '@/lib/validation/types';
import { PROVIDERS } from '@/lib/config';

interface ApiKeyStatusProps {
  apiKeys: ApiKeys;
  onProviderClick?: (provider: Provider) => void;
}

export default function ApiKeyStatus({ apiKeys, onProviderClick }: ApiKeyStatusProps) {
  const providerStatus = PROVIDERS.map(provider => ({
    ...provider,
    hasKey: !!apiKeys[provider.key],
  }));

  const configuredCount = providerStatus.filter(p => p.hasKey).length;

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">API Keys Status</h2>
        <Link
          href="/settings"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Configure Keys →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {providerStatus.map(provider => (
          <button
            key={provider.key}
            onClick={() => provider.hasKey && onProviderClick?.(provider.key)}
            disabled={!provider.hasKey}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              provider.hasKey
                ? 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 cursor-pointer'
                : 'border-red-200 bg-red-50 cursor-not-allowed opacity-75'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {provider.hasKey ? (
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <span className="font-medium text-gray-900">{provider.name}</span>
            </div>
            <p className="text-xs text-gray-600">
              {provider.hasKey ? 'Configured' : 'Not configured'}
            </p>
            {provider.hasKey && (
              <p className="text-xs text-green-700 mt-1 font-medium">
                Click to test →
              </p>
            )}
          </button>
        ))}
      </div>

      {configuredCount === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            No API keys configured. Add keys in{' '}
            <Link href="/settings" className="font-medium underline">
              Settings
            </Link>{' '}
            to run tests.
          </p>
        </div>
      )}

      {configuredCount > 0 && configuredCount < 4 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {configuredCount} of 4 providers configured. Tests will be skipped for
            providers without API keys.
          </p>
        </div>
      )}
    </div>
  );
}
