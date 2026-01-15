'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProvider } from '@/lib/config';
import { trackEvent } from '@/lib/analytics';

function TestPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [testing, setTesting] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const provider = searchParams.get('provider');
  const apiKey = searchParams.get('key');

  const providerConfig = getProvider(provider as 'openai' | 'anthropic' | 'openrouter' | 'gemini');
  const providerName = providerConfig?.name || provider;

  useEffect(() => {
    if (!provider || !apiKey) {
      setResult({
        success: false,
        message: 'Missing provider or API key',
      });
      setTesting(false);
      return;
    }

    testApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, apiKey]);

  const testApiKey = async () => {
    setTesting(true);

    // Track that a key test was initiated
    trackEvent('api_key_tested', { provider: provider as 'openai' | 'anthropic' | 'openrouter' | 'gemini' });

    try {
      const { getTestModel } = await import('@/lib/config');
      const model = getTestModel(provider as 'openai' | 'anthropic' | 'openrouter' | 'gemini');

      if (!model) {
        throw new Error('Unknown provider');
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Say "Hello" in one word.',
          provider,
          model,
          apiKey,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Track successful test
        trackEvent('api_key_test_success', { provider: provider as 'openai' | 'anthropic' | 'openrouter' | 'gemini' });

        setResult({
          success: true,
          message: 'API key is valid and working!',
          details: `Response: ${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}`,
        });
      } else {
        // Track failed test
        trackEvent('api_key_test_failure', { provider: provider as 'openai' | 'anthropic' | 'openrouter' | 'gemini' });

        setResult({
          success: false,
          message: 'API key test failed',
          details: data.error || 'Unknown error occurred',
        });
      }
    } catch (error: any) {
      // Track failed test
      trackEvent('api_key_test_failure', { provider: provider as 'openai' | 'anthropic' | 'openrouter' | 'gemini' });

      setResult({
        success: false,
        message: 'Test failed',
        details: error.message || 'Network error occurred',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="w-[80%] mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            href="/settings"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-1"
          >
            <span>←</span> Back to Settings
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
          Testing {providerName} API Key
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
          Making a test API call to verify your key...
        </p>

        <div className="card p-8 max-w-2xl">
          {testing ? (
            <div className="flex flex-col items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Testing API key...</p>
            </div>
          ) : result ? (
            <div>
              {result.success ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0 mt-1"
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
                    <div>
                      <h2 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">
                        {result.message}
                      </h2>
                      {result.details && (
                        <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                          {result.details}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-4">
                    <Link
                      href="/settings"
                      className="btn-primary inline-block"
                    >
                      Back to Settings
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-1"
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
                    <div>
                      <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
                        {result.message}
                      </h2>
                      {result.details && (
                        <p className="text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                          {result.details}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                        Please check your API key and try again.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Link
                      href="/settings"
                      className="btn-primary"
                    >
                      Back to Settings
                    </Link>
                    <button
                      onClick={testApiKey}
                      className="btn-secondary"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="w-[80%] mx-auto px-4 py-12">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        </div>
      </div>
    }>
      <TestPageContent />
    </Suspense>
  );
}
