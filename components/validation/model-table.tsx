/**
 * Model Table Component
 *
 * Displays models in a table format with selection checkboxes and inline results
 */

'use client';

import React, { useState } from 'react';
import { ModelConfig, TestResult, Provider, EXCLUDED_MODEL_PATTERNS } from '@/lib/validation/types';
import { PROVIDERS } from '@/lib/config';

// Filter to only cloud providers (those that need API keys and can be tested)
const CLOUD_PROVIDERS = PROVIDERS.filter(p => !p.isLocal);

/**
 * Check if a model is excluded from user-facing app
 */
function isModelExcluded(modelId: string): boolean {
  return EXCLUDED_MODEL_PATTERNS.some(pattern => pattern.test(modelId));
}

/**
 * Format model type from AIML API for display
 * Maps AIML types to user-friendly labels with icons
 */
function formatModelType(type: string): string {
  const typeMap: Record<string, string> = {
    'image': '🎨 Image',
    'video': '🎬 Video',
    'audio': '🎵 Audio',
    'chat-completion': '💬 Chat',
    'chat': '💬 Chat',
    'responses': '🤖 Response',
    'embedding': '🔢 Embedding',
    'stt': '🎤 Speech-to-Text',
    'tts': '🔊 Text-to-Speech',
    'language-completion': '✍️ Completion',
    'document': '📄 Document',
    'realtime': '⚡ Realtime',
    'unknown': '❓ Unknown',
    'generateContent': '💬 Chat',
    'embedContent': '🔢 Embedding',
  };

  return typeMap[type] || `📋 ${type}`;
}

interface ModelTableProps {
  models: ModelConfig[];
  selectedModels: Set<string>;
  onModelToggle: (provider: Provider, model: string) => void;
  onSelectAllProvider: (provider: Provider) => void;
  onTestSingleModel: (provider: Provider, model: string) => void;
  results: Map<string, TestResult>;
  testing: boolean;
  testingModels: Set<string>;
}

export default function ModelTable({
  models,
  selectedModels,
  onModelToggle,
  onSelectAllProvider,
  onTestSingleModel,
  results,
  testing,
  testingModels,
}: ModelTableProps) {
  const [expandedProviders, setExpandedProviders] = useState<Set<Provider>>(
    new Set(['openai', 'anthropic', 'openrouter', 'gemini'])
  );

  const toggleProvider = (provider: Provider) => {
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(provider)) {
      newExpanded.delete(provider);
    } else {
      newExpanded.add(provider);
    }
    setExpandedProviders(newExpanded);
  };

  // Status badge component
  const StatusBadge = ({ result, excluded }: { result?: TestResult; excluded?: boolean }) => {
    if (excluded) {
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-500">
          ⊘ Excluded
        </span>
      );
    }

    if (!result || result.status === 'pending') {
      return <span className="text-xs text-gray-500">Not tested</span>;
    }

    const statusStyles: Record<string, string> = {
      running: 'bg-blue-100 text-blue-700',
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      skipped: 'bg-yellow-100 text-yellow-700',
      untested: 'bg-purple-100 text-purple-700',
      pending: 'bg-gray-100 text-gray-700',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[result.status]}`}>
        {result.status === 'running' && '⏳ Testing...'}
        {result.status === 'success' && '✓ Passed'}
        {result.status === 'failed' && '✗ Failed'}
        {result.status === 'skipped' && '⊘ Skipped'}
        {result.status === 'untested' && '⚠ Exists'}
      </span>
    );
  };

  // Result details component
  const ResultDetails = ({ result }: { result?: TestResult }) => {
    if (!result || (result.status !== 'success' && result.status !== 'untested')) {
      return null;
    }

    return (
      <div className="text-xs text-gray-600 mt-1">
        {result.latency !== undefined && <span>Latency: {result.latency}ms</span>}
        {result.tokens !== undefined && <span className="ml-3">Tokens: {result.tokens}</span>}
      </div>
    );
  };

  if (models.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500 text-lg">
          Select a provider above to see available models
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                Select
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Model
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-36">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {CLOUD_PROVIDERS.map(provider => {
              const providerModels = models.filter(m => m.provider === provider.key);
              if (providerModels.length === 0) return null;

              const isExpanded = expandedProviders.has(provider.key as Provider);
              const providerKeys = providerModels.map(m => `${m.provider}:${m.model}`);
              const allProviderSelected = providerKeys.every(key => selectedModels.has(key));

              return (
                <React.Fragment key={provider.key}>
                  {/* Provider Header Row */}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allProviderSelected}
                        onChange={() => onSelectAllProvider(provider.key as Provider)}
                        disabled={testing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td colSpan={3} className="px-4 py-3">
                      <button
                        onClick={() => toggleProvider(provider.key as Provider)}
                        className="flex items-center gap-2 font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        <span className="text-sm">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <span>
                          {provider.name} ({providerModels.length} models)
                        </span>
                      </button>
                    </td>
                  </tr>

                  {/* Provider Models */}
                  {isExpanded && providerModels.map(model => {
                    const key = `${model.provider}:${model.model}`;
                    const result = results.get(key);
                    const excluded = isModelExcluded(model.model);

                    return (
                      <tr
                        key={key}
                        className={`hover:bg-gray-50 ${
                          excluded ? 'opacity-50 bg-gray-50' :
                          selectedModels.has(key) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedModels.has(key)}
                            onChange={() => onModelToggle(model.provider, model.model)}
                            disabled={testing || excluded}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <code className={`text-sm ${excluded ? 'text-gray-400' : 'text-gray-900'}`}>
                            {model.model}
                          </code>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs ${excluded ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatModelType(model.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge result={result} excluded={excluded} />
                          {!excluded && <ResultDetails result={result} />}
                          {!excluded && result?.error && (
                            <div className={`text-xs mt-1 ${
                              result.status === 'untested' ? 'text-purple-600' : 'text-red-600'
                            }`}>
                              {result.error}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onTestSingleModel(model.provider, model.model)}
                            disabled={testingModels.has(key) || excluded}
                            className={`text-xs px-3 py-1 rounded transition-colors ${
                              excluded
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {testingModels.has(key) ? 'Testing...' : 'Test'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
