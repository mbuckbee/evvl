/**
 * API Validation Dashboard
 *
 * Browser-based page for testing API connectivity and model availability
 * Uses server-side API keys to validate configured models
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Provider,
  ApiKeys,
  ModelConfig,
  TestResult,
} from '@/lib/validation/types';
import ApiKeyStatus, { ProviderLoadingState } from '@/components/validation/api-key-status';
import TestControls from '@/components/validation/test-controls';
import TestSummary from '@/components/validation/test-summary';
import ModelTable from '@/components/validation/model-table';
import type { ProviderModelsResponse } from '@/app/api/provider-models/route';
import type { ApiKeysStatus } from '@/app/api/api-keys-status/route';

export default function ApiValidationPage() {
  // State
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [keysLoading, setKeysLoading] = useState(true);
  const [allModels, setAllModels] = useState<ModelConfig[]>([]);
  const [providerStates, setProviderStates] = useState<Record<Provider, ProviderLoadingState>>({
    openai: { loading: true },
    anthropic: { loading: true },
    gemini: { loading: true },
    openrouter: { loading: true },
  });
  const [selectedProviders, setSelectedProviders] = useState<Set<Provider>>(
    new Set(['openai', 'anthropic', 'openrouter', 'gemini'])
  );
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [testing, setTesting] = useState(false);
  const [testingModels, setTestingModels] = useState<Set<string>>(new Set());

  // Use ref to track if we should stop testing
  const shouldStopRef = useRef(false);

  // Load API keys and models in parallel on mount
  useEffect(() => {
    async function loadData() {
      // Start both requests in parallel
      const keysPromise = fetch('/api/api-keys-status').then(r => r.json());
      const modelsPromise = fetch('/api/provider-models').then(r => r.json());

      // Process keys as soon as they arrive (fast)
      try {
        const keysStatus: ApiKeysStatus = await keysPromise;
        const keys: ApiKeys = {
          openai: keysStatus.openai ? 'configured' : '',
          anthropic: keysStatus.anthropic ? 'configured' : '',
          openrouter: keysStatus.openrouter ? 'configured' : '',
          gemini: keysStatus.gemini ? 'configured' : '',
        };
        setApiKeys(keys);
        setKeysLoading(false);
      } catch (error) {
        console.error('Failed to load API keys status:', error);
        setKeysLoading(false);
      }

      // Process models when they arrive (slower)
      try {
        const modelsData: ProviderModelsResponse = await modelsPromise;

        const models: ModelConfig[] = [];
        const newStates: Record<Provider, ProviderLoadingState> = {
          openai: { loading: false },
          anthropic: { loading: false },
          gemini: { loading: false },
          openrouter: { loading: false },
        };

        // OpenAI models
        if (modelsData.providers.openai.available) {
          modelsData.providers.openai.models.forEach(m => {
            models.push({
              provider: 'openai',
              model: m.id,
              label: m.displayName,
              type: m.type,
            });
          });
          newStates.openai = {
            loading: false,
            modelCount: modelsData.providers.openai.models.length,
          };
        } else if (modelsData.providers.openai.error) {
          newStates.openai = {
            loading: false,
            error: modelsData.providers.openai.error,
          };
        }

        // Anthropic models
        if (modelsData.providers.anthropic.available) {
          modelsData.providers.anthropic.models.forEach(m => {
            models.push({
              provider: 'anthropic',
              model: m.id,
              label: m.displayName,
              type: m.type,
            });
          });
          newStates.anthropic = {
            loading: false,
            modelCount: modelsData.providers.anthropic.models.length,
          };
        } else if (modelsData.providers.anthropic.error) {
          newStates.anthropic = {
            loading: false,
            error: modelsData.providers.anthropic.error,
          };
        }

        // Gemini models
        if (modelsData.providers.gemini.available) {
          modelsData.providers.gemini.models.forEach(m => {
            models.push({
              provider: 'gemini',
              model: m.id,
              label: m.displayName,
              type: m.type,
            });
          });
          newStates.gemini = {
            loading: false,
            modelCount: modelsData.providers.gemini.models.length,
          };
        } else if (modelsData.providers.gemini.error) {
          newStates.gemini = {
            loading: false,
            error: modelsData.providers.gemini.error,
          };
        }

        // OpenRouter models
        if (modelsData.providers.openrouter.available) {
          modelsData.providers.openrouter.models.forEach(m => {
            models.push({
              provider: 'openrouter',
              model: m.id,
              label: m.displayName,
              type: m.type || 'chat',
            });
          });
          newStates.openrouter = {
            loading: false,
            modelCount: modelsData.providers.openrouter.models.length,
          };
        } else if (modelsData.providers.openrouter.error) {
          newStates.openrouter = {
            loading: false,
            error: modelsData.providers.openrouter.error,
          };
        }

        setAllModels(models);
        setProviderStates(newStates);
      } catch (error) {
        console.error('Failed to load models:', error);
        setProviderStates({
          openai: { loading: false, error: 'Failed to fetch' },
          anthropic: { loading: false, error: 'Failed to fetch' },
          gemini: { loading: false, error: 'Failed to fetch' },
          openrouter: { loading: false, error: 'Failed to fetch' },
        });
      }
    }

    loadData();
  }, []);

  // Handle running tests via server-side API (one at a time from client)
  const handleRunTests = async () => {
    // Reset stop flag
    shouldStopRef.current = false;
    setTesting(true);

    // Get selected models to test
    const modelsToTest = allModels.filter(m =>
      selectedModels.has(`${m.provider}:${m.model}`)
    );

    // Initialize results map with pending status
    const initialResults = new Map<string, TestResult>();
    modelsToTest.forEach(model => {
      const key = `${model.provider}:${model.model}`;
      initialResults.set(key, {
        provider: model.provider,
        model: model.model,
        modelLabel: model.label,
        status: 'pending',
        type: model.type,
        timestamp: Date.now(),
      });
    });
    setTestResults(initialResults);

    // Run tests one at a time from client side
    for (const model of modelsToTest) {
      // Check if we should stop
      if (shouldStopRef.current) {
        break;
      }

      const key = `${model.provider}:${model.model}`;

      // Update status to running
      setTestResults(prev => {
        const newResults = new Map(prev);
        const existing = newResults.get(key);
        if (existing) {
          newResults.set(key, { ...existing, status: 'running' });
        }
        return newResults;
      });

      // Run test for single model
      try {
        const response = await fetch('/api/validation/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ models: [model] }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            setTestResults(prev => {
              const newResults = new Map(prev);
              newResults.set(key, result);
              return newResults;
            });
          }
        } else {
          // Mark as failed on HTTP error
          setTestResults(prev => {
            const newResults = new Map(prev);
            newResults.set(key, {
              provider: model.provider,
              model: model.model,
              modelLabel: model.label,
              status: 'failed',
              type: model.type,
              timestamp: Date.now(),
              error: `HTTP ${response.status}`,
            });
            return newResults;
          });
        }
      } catch (error: any) {
        // Mark as failed on network error
        setTestResults(prev => {
          const newResults = new Map(prev);
          newResults.set(key, {
            provider: model.provider,
            model: model.model,
            modelLabel: model.label,
            status: 'failed',
            type: model.type,
            timestamp: Date.now(),
            error: error.message || 'Network error',
          });
          return newResults;
        });
      }
    }

    setTesting(false);
  };

  // Handle stopping tests
  const handleStopTests = () => {
    shouldStopRef.current = true;
    // Mark pending tests as skipped
    setTestResults(prev => {
      const newResults = new Map(prev);
      for (const [key, result] of newResults) {
        if (result.status === 'pending') {
          newResults.set(key, { ...result, status: 'skipped' });
        }
      }
      return newResults;
    });
  };

  // Handle clearing results
  const handleClearResults = () => {
    setTestResults(new Map());
  };

  // Handle provider click from API key status
  const handleProviderClick = (provider: Provider) => {
    // Select only this provider
    setSelectedProviders(new Set([provider]));
    // Clear any previous model selections
    setSelectedModels(new Set());
  };

  // Handle model checkbox toggle
  const handleModelToggle = (provider: Provider, model: string) => {
    const key = `${provider}:${model}`;
    const newModels = new Set(selectedModels);
    if (newModels.has(key)) {
      newModels.delete(key);
    } else {
      newModels.add(key);
    }
    setSelectedModels(newModels);
  };

  // Handle select all for a specific provider
  const handleSelectAllProvider = (provider: Provider) => {
    const providerModels = allModels.filter(m =>
      m.provider === provider && selectedProviders.has(provider)
    );
    const providerKeys = providerModels.map(m => `${m.provider}:${m.model}`);

    // Check if all provider models are already selected
    const allSelected = providerKeys.every(key => selectedModels.has(key));

    const newModels = new Set(selectedModels);
    if (allSelected) {
      // Deselect all provider models
      providerKeys.forEach(key => newModels.delete(key));
    } else {
      // Select all provider models
      providerKeys.forEach(key => newModels.add(key));
    }
    setSelectedModels(newModels);
  };

  // Handle testing a single model via server-side API
  const handleTestSingleModel = async (provider: Provider, modelId: string) => {
    // Find the model config
    const modelConfig = allModels.find(
      m => m.provider === provider && m.model === modelId
    );
    if (!modelConfig) return;

    const key = `${provider}:${modelId}`;

    // Add to testing models set
    setTestingModels(prev => new Set(prev).add(key));

    // Initialize result with running status
    setTestResults(prev => {
      const newResults = new Map(prev);
      newResults.set(key, {
        provider: modelConfig.provider,
        model: modelConfig.model,
        modelLabel: modelConfig.label,
        status: 'running',
        type: modelConfig.type,
        timestamp: Date.now(),
      });
      return newResults;
    });

    // Run validation for single model via server endpoint
    try {
      const response = await fetch('/api/validation/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: [modelConfig] }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          setTestResults(prev => {
            const newResults = new Map(prev);
            newResults.set(key, result);
            return newResults;
          });
        }
      }
    } catch (error) {
      console.error('Single model test error:', error);
      setTestResults(prev => {
        const newResults = new Map(prev);
        newResults.set(key, {
          provider: modelConfig.provider,
          model: modelConfig.model,
          modelLabel: modelConfig.label,
          status: 'failed',
          type: modelConfig.type,
          timestamp: Date.now(),
          error: 'Request failed',
        });
        return newResults;
      });
    }

    // Remove from testing models set
    setTestingModels(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  // Check if any provider is still loading models
  const modelsLoading = Object.values(providerStates).some(s => s.loading);

  return (
    <div className="w-[80%] mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/backroom"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
        >
          <span>←</span> Back to Backroom
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-3 text-gray-900">API Validation Dashboard</h1>
      <p className="text-lg text-gray-600 mb-10">
        Test model availability and API connectivity using your configured API keys
      </p>

      {/* API Key Status */}
      <ApiKeyStatus
        apiKeys={apiKeys}
        keysLoading={keysLoading}
        providerStates={providerStates}
        onProviderClick={handleProviderClick}
      />

      {/* Test Controls */}
      <TestControls
        selectedProviders={selectedProviders}
        onProvidersChange={setSelectedProviders}
        selectedModels={selectedModels}
        onModelsChange={setSelectedModels}
        allModels={allModels}
        onRun={handleRunTests}
        onStop={handleStopTests}
        onClear={handleClearResults}
        testing={testing || keysLoading || modelsLoading}
        hasResults={testResults.size > 0}
      />

      {/* Test Summary */}
      {testResults.size > 0 && (
        <TestSummary
          results={testResults}
          testing={testing}
          totalModels={testResults.size}
        />
      )}

      {/* Model Table */}
      {modelsLoading && allModels.length === 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span>Loading available models...</span>
          </div>
        </div>
      )}
      <ModelTable
        models={allModels.filter(m => selectedProviders.has(m.provider))}
        selectedModels={selectedModels}
        onModelToggle={handleModelToggle}
        onSelectAllProvider={handleSelectAllProvider}
        onTestSingleModel={handleTestSingleModel}
        results={testResults}
        testing={testing}
        testingModels={testingModels}
      />
    </div>
  );
}
