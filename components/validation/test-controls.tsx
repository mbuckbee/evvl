/**
 * Test Controls Component
 *
 * Controls for selecting test mode and running tests
 */

'use client';

import { TestMode, ModelConfig, Provider } from '@/lib/validation/types';
import { PROVIDERS } from '@/lib/config';

interface TestControlsProps {
  mode: TestMode;
  onModeChange: (mode: TestMode) => void;
  selectedProviders: Set<Provider>;
  onProvidersChange: (providers: Set<Provider>) => void;
  selectedModels: Set<string>;
  onModelsChange: (models: Set<string>) => void;
  allModels: ModelConfig[];
  onRun: () => void;
  onStop: () => void;
  onClear: () => void;
  testing: boolean;
  hasResults: boolean;
}

export default function TestControls({
  mode,
  onModeChange,
  selectedProviders,
  onProvidersChange,
  selectedModels,
  onModelsChange,
  allModels,
  onRun,
  onStop,
  onClear,
  testing,
  hasResults,
}: TestControlsProps) {
  // Get models for selected providers
  const availableModels = allModels.filter(m =>
    mode === 'individual' ? selectedProviders.has(m.provider) : true
  );

  // Count selected models
  const selectedCount = mode === 'individual' ? selectedModels.size : 0;

  // Handle select all / deselect all
  const handleToggleAll = () => {
    if (selectedModels.size === availableModels.length) {
      // Deselect all
      onModelsChange(new Set());
    } else {
      // Select all
      const allKeys = new Set(availableModels.map(m => `${m.provider}:${m.model}`));
      onModelsChange(allKeys);
    }
  };

  // Handle provider checkbox
  const handleProviderToggle = (provider: Provider) => {
    const newProviders = new Set(selectedProviders);
    if (newProviders.has(provider)) {
      newProviders.delete(provider);
    } else {
      newProviders.add(provider);
    }
    onProvidersChange(newProviders);
  };

  // Handle model checkbox
  const handleModelToggle = (provider: Provider, model: string) => {
    const key = `${provider}:${model}`;
    const newModels = new Set(selectedModels);
    if (newModels.has(key)) {
      newModels.delete(key);
    } else {
      newModels.add(key);
    }
    onModelsChange(newModels);
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Test Controls</h2>

      {/* Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Test Mode
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => onModeChange('quick')}
            disabled={testing}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              mode === 'quick'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${testing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="font-medium text-gray-900">Quick Mode</div>
            <div className="text-sm text-gray-600 mt-1">
              Test 1 model per provider (4 total)
            </div>
          </button>

          <button
            onClick={() => onModeChange('full')}
            disabled={testing}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              mode === 'full'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${testing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="font-medium text-gray-900">Full Mode</div>
            <div className="text-sm text-gray-600 mt-1">
              Test all available models ({allModels.length} total)
            </div>
          </button>

          <button
            onClick={() => onModeChange('individual')}
            disabled={testing}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              mode === 'individual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${testing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="font-medium text-gray-900">Individual Mode</div>
            <div className="text-sm text-gray-600 mt-1">
              Select specific models to test
            </div>
          </button>
        </div>
      </div>

      {/* Individual Mode: Provider Selection */}
      {mode === 'individual' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Providers
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROVIDERS.map(provider => (
              <label
                key={provider.key}
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProviders.has(provider.key)}
                  onChange={() => handleProviderToggle(provider.key)}
                  disabled={testing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  {provider.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Individual Mode: Model Selection */}
      {mode === 'individual' && selectedProviders.size > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Models ({selectedCount} selected)
            </label>
            <button
              onClick={handleToggleAll}
              disabled={testing}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {selectedModels.size === availableModels.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4">
            {PROVIDERS.filter(p => selectedProviders.has(p.key)).map(provider => {
              const providerModels = availableModels.filter(
                m => m.provider === provider.key
              );

              if (providerModels.length === 0) return null;

              return (
                <div key={provider.key}>
                  <div className="font-medium text-gray-900 mb-2">
                    {provider.name} ({providerModels.length} models)
                  </div>
                  <div className="space-y-1">
                    {providerModels.map(model => {
                      const key = `${model.provider}:${model.model}`;
                      return (
                        <label
                          key={key}
                          className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedModels.has(key)}
                            onChange={() =>
                              handleModelToggle(model.provider, model.model)
                            }
                            disabled={testing}
                            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {model.label}
                            </div>
                            <div className="text-xs text-gray-500 font-mono truncate">
                              {model.model}
                            </div>
                            <div className="text-xs text-gray-500">
                              {model.type === 'image' ? '🎨 Image' : '💬 Text'}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!testing ? (
          <button
            onClick={onRun}
            disabled={
              mode === 'individual' && selectedModels.size === 0
            }
            className="btn-primary"
          >
            {mode === 'quick' && 'Run Quick Test (4 models)'}
            {mode === 'full' && `Run Full Test (${allModels.length} models)`}
            {mode === 'individual' && selectedModels.size > 0 &&
              `Run Test (${selectedModels.size} models)`}
            {mode === 'individual' && selectedModels.size === 0 &&
              'Select models to test'}
          </button>
        ) : (
          <button onClick={onStop} className="btn-secondary">
            Stop Testing
          </button>
        )}

        {hasResults && !testing && (
          <button onClick={onClear} className="btn-secondary">
            Clear Results
          </button>
        )}
      </div>
    </div>
  );
}
