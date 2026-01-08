/**
 * Provider Results Component
 *
 * Displays test results grouped by provider in collapsible sections
 */

'use client';

import { useState } from 'react';
import { TestResult, ModelConfig, Provider } from '@/lib/validation/types';
import { PROVIDERS } from '@/lib/config';
import ModelTestCard from './model-test-card';

interface ProviderResultsProps {
  results: Map<string, TestResult>;
  models: ModelConfig[];
}

export default function ProviderResults({
  results,
  models,
}: ProviderResultsProps) {
  const [expandedProviders, setExpandedProviders] = useState<Set<Provider>>(
    new Set(['openai', 'anthropic', 'openrouter', 'gemini'])
  );

  if (results.size === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500 text-lg">
          No test results yet. Select a test mode and click &quot;Run Test&quot; to begin.
        </p>
      </div>
    );
  }

  const toggleProvider = (provider: Provider) => {
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(provider)) {
      newExpanded.delete(provider);
    } else {
      newExpanded.add(provider);
    }
    setExpandedProviders(newExpanded);
  };

  return (
    <div className="space-y-4">
      {PROVIDERS.map(provider => {
        // Get all results for this provider
        const providerResults = Array.from(results.values()).filter(
          r => r.provider === provider.key
        );

        if (providerResults.length === 0) return null;

        // Calculate provider stats
        const passed = providerResults.filter(r => r.status === 'success').length;
        const failed = providerResults.filter(r => r.status === 'failed').length;
        const skipped = providerResults.filter(r => r.status === 'skipped').length;
        const running = providerResults.filter(r => r.status === 'running').length;

        const isExpanded = expandedProviders.has(provider.key);

        return (
          <div key={provider.key} className="card">
            {/* Provider Header */}
            <button
              onClick={() => toggleProvider(provider.key)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900">
                    {provider.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {providerResults.length} model
                    {providerResults.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {running > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-700">
                      {running} running
                    </span>
                  </div>
                )}
                {passed > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-green-700">{passed}</span>
                    <span className="text-gray-600"> passed</span>
                  </div>
                )}
                {failed > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-red-700">{failed}</span>
                    <span className="text-gray-600"> failed</span>
                  </div>
                )}
                {skipped > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-yellow-700">{skipped}</span>
                    <span className="text-gray-600"> skipped</span>
                  </div>
                )}
              </div>
            </button>

            {/* Provider Results */}
            {isExpanded && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providerResults.map(result => {
                    const key = `${result.provider}:${result.model}`;
                    return <ModelTestCard key={key} result={result} />;
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
