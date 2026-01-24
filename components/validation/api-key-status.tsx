/**
 * API Key Status Component
 *
 * Displays which API keys are configured and model loading status per provider
 */

'use client';

import Link from 'next/link';
import { ApiKeys, Provider } from '@/lib/validation/types';
import { PROVIDERS } from '@/lib/config';

export interface ProviderLoadingState {
  loading: boolean;
  error?: string;
  modelCount?: number;
}

interface ApiKeyStatusProps {
  apiKeys: ApiKeys;
  keysLoading?: boolean;
  providerStates?: Record<Provider, ProviderLoadingState>;
  onProviderClick?: (provider: Provider) => void;
}

export default function ApiKeyStatus({
  apiKeys,
  keysLoading = false,
  providerStates,
  onProviderClick
}: ApiKeyStatusProps) {
  const providerStatus = PROVIDERS.map(provider => ({
    ...provider,
    hasKey: !!apiKeys[provider.key],
    state: providerStates?.[provider.key],
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
        {providerStatus.map(provider => {
          const state = provider.state;
          const isLoading = keysLoading || state?.loading;
          const hasError = state?.error;

          // Determine border and background colors based on state (with dark mode support)
          let borderClass = 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';

          if (keysLoading) {
            borderClass = 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
          } else if (!provider.hasKey) {
            borderClass = 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30';
          } else if (hasError) {
            borderClass = 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/30';
          } else if (state?.loading) {
            borderClass = 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30';
          } else {
            borderClass = 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 dark:border-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:hover:border-green-700';
          }

          return (
            <button
              key={provider.key}
              onClick={() => provider.hasKey && !isLoading && onProviderClick?.(provider.key)}
              disabled={!provider.hasKey || isLoading}
              className={`p-4 rounded-lg border-2 text-left transition-all ${borderClass} ${
                provider.hasKey && !isLoading ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {keysLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : !provider.hasKey ? (
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
                ) : hasError ? (
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ) : state?.loading ? (
                  <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                ) : (
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
                )}
                <span className="font-medium text-gray-900 dark:text-gray-100">{provider.name}</span>
              </div>

              {/* Status text */}
              {keysLoading ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">Checking...</p>
              ) : !provider.hasKey ? (
                <p className="text-xs text-red-600 dark:text-red-400">Not configured</p>
              ) : hasError ? (
                <p className="text-xs text-orange-600 dark:text-orange-400" title={state.error}>
                  Error loading models
                </p>
              ) : state?.loading ? (
                <p className="text-xs text-blue-600 dark:text-blue-400">Loading models...</p>
              ) : (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {state?.modelCount !== undefined
                      ? `${state.modelCount} models available`
                      : 'Configured'}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1 font-medium">
                    Click to test →
                  </p>
                </>
              )}
            </button>
          );
        })}
      </div>

      {!keysLoading && configuredCount === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            No API keys configured. Add keys in{' '}
            <Link href="/settings" className="font-medium underline">
              Settings
            </Link>{' '}
            to run tests.
          </p>
        </div>
      )}

      {!keysLoading && configuredCount > 0 && configuredCount < 4 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {configuredCount} of 4 providers configured. Tests will be skipped for
            providers without API keys.
          </p>
        </div>
      )}
    </div>
  );
}
