'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ProjectModelConfig, AIParameters, Provider } from '@/lib/types';
import { saveModelConfig } from '@/lib/storage';
import { PROVIDERS, getDefaultModel, ProviderConfig } from '@/lib/config';
import { fetchOpenRouterModels, getOpenAIModels, getAnthropicModels, getPopularOpenRouterModels, getGeminiModels } from '@/lib/fetch-models';

interface ConfigEditorProps {
  projectId: string;
  config?: ProjectModelConfig;
  onSave?: (config: ProjectModelConfig) => void;
  onCancel?: () => void;
}

export default function ConfigEditor({ projectId, config, onSave, onCancel }: ConfigEditorProps) {
  const [name, setName] = useState(config?.name || '');
  const [provider, setProvider] = useState<Provider>(config?.provider || 'openai');
  const [model, setModel] = useState(config?.model || '');
  const [providers, setProviders] = useState<ProviderConfig[]>(PROVIDERS);

  // Parameters
  const [temperature, setTemperature] = useState<number | undefined>(config?.parameters?.temperature);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(config?.parameters?.maxTokens);
  const [topP, setTopP] = useState<number | undefined>(config?.parameters?.topP);
  const [frequencyPenalty, setFrequencyPenalty] = useState<number | undefined>(config?.parameters?.frequencyPenalty);
  const [presencePenalty, setPresencePenalty] = useState<number | undefined>(config?.parameters?.presencePenalty);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load dynamic models from OpenRouter API
  useEffect(() => {
    async function loadModels() {
      const models = await fetchOpenRouterModels();

      if (models.length > 0) {
        const openaiModels = getOpenAIModels(models);
        const anthropicModels = getAnthropicModels(models);
        const openrouterModels = getPopularOpenRouterModels(models);
        const geminiModels = getGeminiModels(models);

        const updatedProviders = PROVIDERS.map(p => {
          if (p.key === 'openai' && openaiModels.length > 0) {
            return { ...p, models: openaiModels };
          } else if (p.key === 'anthropic' && anthropicModels.length > 0) {
            return { ...p, models: anthropicModels };
          } else if (p.key === 'openrouter' && openrouterModels.length > 0) {
            return { ...p, models: openrouterModels };
          } else if (p.key === 'gemini' && geminiModels.length > 0) {
            return { ...p, models: geminiModels };
          }
          return p;
        });

        setProviders(updatedProviders);

        // Set default model if not editing
        if (!config) {
          const providerConfig = updatedProviders.find(p => p.key === provider);
          if (providerConfig?.models && providerConfig.models.length > 0) {
            setModel(providerConfig.models[0].value);
          }
        }
      }
    }

    loadModels();
  }, []);

  // Update model when provider changes
  useEffect(() => {
    if (!config) {
      const providerConfig = providers.find(p => p.key === provider);
      if (providerConfig) {
        const firstModel = providerConfig.models && providerConfig.models.length > 0
          ? providerConfig.models[0].value
          : getDefaultModel(provider);
        setModel(firstModel);
      }
    }
  }, [provider, providers, config]);

  const handleSave = () => {
    if (!name.trim() || !model) {
      alert('Please provide a name and select a model');
      return;
    }

    const parameters: AIParameters | undefined = temperature !== undefined ||
      maxTokens !== undefined ||
      topP !== undefined ||
      frequencyPenalty !== undefined ||
      presencePenalty !== undefined
      ? {
          temperature,
          maxTokens,
          topP,
          frequencyPenalty,
          presencePenalty,
        }
      : undefined;

    if (config) {
      // Editing existing config
      const updatedConfig: ProjectModelConfig = {
        ...config,
        name: name.trim(),
        provider,
        model,
        parameters,
      };

      saveModelConfig(updatedConfig);
      if (onSave) onSave(updatedConfig);
    } else {
      // Creating new config
      const newConfig: ProjectModelConfig = {
        id: uuidv4(),
        projectId,
        name: name.trim(),
        provider,
        model,
        parameters,
        createdAt: Date.now(),
      };

      saveModelConfig(newConfig);
      if (onSave) onSave(newConfig);
    }
  };

  const currentProvider = providers.find(p => p.key === provider);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {config ? 'Edit Model Config' : 'New Model Config'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Config Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., GPT-4 Creative, Claude for Analysis"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Provider *
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {providers.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model *
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {currentProvider?.models && currentProvider.models.length > 0 ? (
              currentProvider.models.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))
            ) : (
              <option value={getDefaultModel(provider)}>
                {getDefaultModel(provider)}
              </option>
            )}
          </select>
        </div>

        {/* Advanced Parameters Toggle */}
        <div className="pt-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Parameters (optional)
          </button>
        </div>

        {/* Advanced Parameters */}
        {showAdvanced && (
          <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temperature
              </label>
              <input
                type="number"
                value={temperature ?? ''}
                onChange={(e) => setTemperature(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.7 (default)"
                min="0"
                max="2"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Controls randomness (0 = deterministic, 2 = very random)
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={maxTokens ?? ''}
                onChange={(e) => setMaxTokens(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Leave empty for unlimited"
                min="1"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum length of the generated response
              </p>
            </div>

            {/* Top P */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Top P
              </label>
              <input
                type="number"
                value={topP ?? ''}
                onChange={(e) => setTopP(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="1.0 (default)"
                min="0"
                max="1"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Nucleus sampling threshold
              </p>
            </div>

            {/* Frequency Penalty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency Penalty
              </label>
              <input
                type="number"
                value={frequencyPenalty ?? ''}
                onChange={(e) => setFrequencyPenalty(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.0 (default)"
                min="0"
                max="2"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Reduces repetition of tokens based on frequency
              </p>
            </div>

            {/* Presence Penalty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Presence Penalty
              </label>
              <input
                type="number"
                value={presencePenalty ?? ''}
                onChange={(e) => setPresencePenalty(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.0 (default)"
                min="0"
                max="2"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Reduces repetition of tokens based on presence
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {config ? 'Save Changes' : 'Create Config'}
        </button>
      </div>
    </div>
  );
}
