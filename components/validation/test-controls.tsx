/**
 * Test Controls Component
 *
 * Controls for selecting models and running tests
 */

'use client';

import { ModelConfig, Provider } from '@/lib/validation/types';
import { PROVIDERS } from '@/lib/config';

// Filter to only cloud providers (those that can be tested)
const CLOUD_PROVIDERS = PROVIDERS.filter(p => !p.isLocal);

interface TestControlsProps {
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
  const availableModels = allModels.filter(m => selectedProviders.has(m.provider));

  // Handle select all / deselect all
  const handleToggleAll = () => {
    if (selectedModels.size === availableModels.length && availableModels.length > 0) {
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

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Test Controls</h2>

      {/* Provider Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Filter by Provider
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CLOUD_PROVIDERS.map(provider => (
            <label
              key={provider.key}
              className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedProviders.has(provider.key as Provider)}
                onChange={() => handleProviderToggle(provider.key as Provider)}
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

      {/* Model Selection Info */}
      {selectedProviders.size > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Selected Models ({selectedModels.size} of {availableModels.length})
            </label>
            <button
              onClick={handleToggleAll}
              disabled={testing || availableModels.length === 0}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {selectedModels.size === availableModels.length && availableModels.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          <p className="text-sm text-gray-600">
            Select models from the table below, then click Run Test.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!testing ? (
          <button
            onClick={onRun}
            disabled={selectedModels.size === 0}
            className="btn-primary"
          >
            {selectedModels.size > 0
              ? `Run Test (${selectedModels.size} models)`
              : 'Select models to test'}
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
