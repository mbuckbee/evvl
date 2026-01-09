/**
 * API Validation Dashboard
 *
 * Browser-based page for testing API connectivity and model availability
 * Uses localStorage API keys to validate all configured models
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Provider,
  ApiKeys,
  ModelConfig,
  TestResult,
  TestMode,
} from '@/lib/validation/types';
import { isImageModel, runValidation, getModelsForMode } from '@/lib/validation/runner';
import { fetchOpenRouterModels, getOpenAIModels, getAnthropicModels, getGeminiModels, getPopularOpenRouterModels } from '@/lib/fetch-models';
import { loadApiKeys } from '@/lib/storage';
import { getTestModel } from '@/lib/config';
import ApiKeyStatus from '@/components/validation/api-key-status';
import TestControls from '@/components/validation/test-controls';
import TestSummary from '@/components/validation/test-summary';
import ProviderResults from '@/components/validation/provider-results';
import ModelTable from '@/components/validation/model-table';

export default function ApiValidationPage() {
  // State
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [allModels, setAllModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState<TestMode>('quick');
  const [selectedProviders, setSelectedProviders] = useState<Set<Provider>>(
    new Set(['openai', 'anthropic', 'openrouter', 'gemini'])
  );
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [testing, setTesting] = useState(false);
  const [testingModels, setTestingModels] = useState<Set<string>>(new Set());

  // Use ref to track if we should stop testing
  const shouldStopRef = useRef(false);

  // Load API keys and models on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      try {
        // Load API keys from localStorage
        const keys = loadApiKeys();
        setApiKeys(keys);

        // Fetch models from OpenRouter
        const openRouterModels = await fetchOpenRouterModels();

        // Filter models by provider
        const openAIModels = getOpenAIModels(openRouterModels);
        const anthropicModels = getAnthropicModels(openRouterModels);
        const geminiModels = getGeminiModels(openRouterModels);
        const openRouterPopular = getPopularOpenRouterModels(openRouterModels);

        // Convert to ModelConfig format
        const models: ModelConfig[] = [];

        // OpenAI models
        openAIModels.forEach(m => {
          const modelId = m.value;
          models.push({
            provider: 'openai',
            model: modelId,
            label: m.label,
            type: isImageModel('openai', modelId) ? 'image' : 'text',
          });
        });

        // Anthropic models
        anthropicModels.forEach(m => {
          models.push({
            provider: 'anthropic',
            model: m.value,
            label: m.label,
            type: 'text',
          });
        });

        // Gemini models
        geminiModels.forEach(m => {
          const modelId = m.value;
          models.push({
            provider: 'gemini',
            model: modelId,
            label: m.label,
            type: isImageModel('gemini', modelId) ? 'image' : 'text',
          });
        });

        // OpenRouter models
        openRouterPopular.forEach(m => {
          models.push({
            provider: 'openrouter',
            model: m.value,
            label: m.label,
            type: 'text',
          });
        });

        setAllModels(models);
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle running tests
  const handleRunTests = async () => {
    // Reset stop flag
    shouldStopRef.current = false;
    setTesting(true);

    // Get test models for quick mode
    const testModels: Record<Provider, string> = {
      openai: getTestModel('openai'),
      anthropic: getTestModel('anthropic'),
      openrouter: getTestModel('openrouter'),
      gemini: getTestModel('gemini'),
    };

    // Determine which models to test
    const modelsToTest = getModelsForMode(
      testMode,
      allModels,
      selectedModels,
      testModels
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

    // Run validation
    await runValidation(
      modelsToTest,
      apiKeys,
      (result) => {
        // Update result in map
        setTestResults(prev => {
          const newResults = new Map(prev);
          const key = `${result.provider}:${result.model}`;
          newResults.set(key, result);
          return newResults;
        });
      },
      () => shouldStopRef.current
    );

    setTesting(false);
  };

  // Handle stopping tests
  const handleStopTests = () => {
    shouldStopRef.current = true;
  };

  // Handle clearing results
  const handleClearResults = () => {
    setTestResults(new Map());
  };

  // Handle mode change
  const handleModeChange = (mode: TestMode) => {
    setTestMode(mode);
    // Reset selections when changing mode
    if (mode !== 'individual') {
      setSelectedModels(new Set());
    }
  };

  // Handle provider click from API key status
  const handleProviderClick = (provider: Provider) => {
    // Switch to individual mode
    setTestMode('individual');
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

  // Handle testing a single model
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

    // Run validation for single model
    await runValidation(
      [modelConfig],
      apiKeys,
      (result) => {
        // Update result in map
        setTestResults(prev => {
          const newResults = new Map(prev);
          const key = `${result.provider}:${result.model}`;
          newResults.set(key, result);
          return newResults;
        });
      },
      () => false // Never stop single model tests
    );

    // Remove from testing models set
    setTestingModels(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading models...</p>
        </div>
      </div>
    );
  }

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
      <ApiKeyStatus apiKeys={apiKeys} onProviderClick={handleProviderClick} />

      {/* Test Controls */}
      <TestControls
        mode={testMode}
        onModeChange={handleModeChange}
        selectedProviders={selectedProviders}
        onProvidersChange={setSelectedProviders}
        selectedModels={selectedModels}
        onModelsChange={setSelectedModels}
        allModels={allModels}
        onRun={handleRunTests}
        onStop={handleStopTests}
        onClear={handleClearResults}
        testing={testing}
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

      {/* Model Table (Individual Mode) or Provider Results (Quick/Full Mode) */}
      {testMode === 'individual' ? (
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
      ) : (
        <ProviderResults results={testResults} models={allModels} />
      )}
    </div>
  );
}
