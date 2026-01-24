'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { ProjectModelConfig, AIParameters, Provider } from '@/lib/types';
import { saveModelConfig } from '@/lib/storage';
import { PROVIDERS, getDefaultModel, ProviderConfig } from '@/lib/config';
import { fetchOpenRouterModels, fetchProviderModels, getOpenAIModels, getAnthropicModels, getPopularOpenRouterModels, getGeminiModels, fetchOllamaModels, fetchLMStudioModels } from '@/lib/fetch-models';
import { getAvailableProviders } from '@/lib/providers/provider-filter';
import { isLocalProvider } from '@/lib/config';

// Map provider to icon name
const providerIconMap: Record<string, string> = {
  openai: 'chatgpt',
  anthropic: 'claude',
  gemini: 'gemini',
  openrouter: 'openrouter',
  ollama: 'ollama',
  lmstudio: 'lmstudio',
};

interface ConfigEditorProps {
  projectId: string;
  config?: ProjectModelConfig;
  defaultProvider?: Provider;
  onSave?: (config: ProjectModelConfig) => void;
  onCancel?: () => void;
}

export default function ConfigEditor({ projectId, config, defaultProvider, onSave, onCancel }: ConfigEditorProps) {
  const [name, setName] = useState(config?.name || '');
  const [provider, setProvider] = useState<Provider>(config?.provider || defaultProvider || 'openai');
  const [model, setModel] = useState(config?.model || '');
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  // Re-check available providers after client hydration (Tauri detection requires window)
  useEffect(() => {
    const availableProviders = getAvailableProviders();
    setProviders(availableProviders);
    setProvidersLoaded(true);
  }, []);

  // Local provider health status
  const [localProviderStatus, setLocalProviderStatus] = useState<Record<string, { running: boolean; loading: boolean }>>({
    ollama: { running: false, loading: false },
    lmstudio: { running: false, loading: false },
  });

  // Parameters
  const [temperature, setTemperature] = useState<number | undefined>(config?.parameters?.temperature);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(config?.parameters?.maxTokens);
  const [topP, setTopP] = useState<number | undefined>(config?.parameters?.topP);
  const [frequencyPenalty, setFrequencyPenalty] = useState<number | undefined>(config?.parameters?.frequencyPenalty);
  const [presencePenalty, setPresencePenalty] = useState<number | undefined>(config?.parameters?.presencePenalty);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load dynamic models from /api/provider-models (for direct providers), OpenRouter, and local providers
  useEffect(() => {
    async function loadModels() {
      const availableProviders = getAvailableProviders();

      // Fetch from all APIs in parallel
      const [providerModelsData, openRouterModels, ollamaModels, lmstudioModels] = await Promise.all([
        fetchProviderModels(),
        fetchOpenRouterModels(),
        // Only fetch local models if those providers are available
        availableProviders.some(p => p.key === 'ollama') ? fetchOllamaModels() : Promise.resolve([]),
        availableProviders.some(p => p.key === 'lmstudio') ? fetchLMStudioModels() : Promise.resolve([]),
      ]);

      // Update local provider status based on whether we got models
      setLocalProviderStatus({
        ollama: { running: ollamaModels.length > 0, loading: false },
        lmstudio: { running: lmstudioModels.length > 0, loading: false },
      });

      // Use provider-models for direct providers (OpenAI, Anthropic, Gemini)
      // Use OpenRouter models only for the OpenRouter provider
      const openaiModels = providerModelsData?.providers.openai.available
        ? getOpenAIModels(providerModelsData.providers.openai.models)
        : [];
      const anthropicModels = providerModelsData?.providers.anthropic.available
        ? getAnthropicModels(providerModelsData.providers.anthropic.models)
        : [];
      const geminiModels = providerModelsData?.providers.gemini.available
        ? getGeminiModels(providerModelsData.providers.gemini.models)
        : [];
      const openrouterModels = openRouterModels.length > 0 ? getPopularOpenRouterModels(openRouterModels) : [];

      const updatedProviders = availableProviders.map(p => {
        if (p.key === 'openai' && openaiModels.length > 0) {
          return { ...p, models: openaiModels };
        } else if (p.key === 'anthropic' && anthropicModels.length > 0) {
          return { ...p, models: anthropicModels };
        } else if (p.key === 'openrouter' && openrouterModels.length > 0) {
          return { ...p, models: openrouterModels };
        } else if (p.key === 'gemini' && geminiModels.length > 0) {
          return { ...p, models: geminiModels };
        } else if (p.key === 'ollama' && ollamaModels.length > 0) {
          return { ...p, models: ollamaModels };
        } else if (p.key === 'lmstudio' && lmstudioModels.length > 0) {
          return { ...p, models: lmstudioModels };
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
        setProviderDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh models for a local provider
  const refreshLocalProviderModels = async (providerKey: 'ollama' | 'lmstudio') => {
    setLocalProviderStatus(prev => ({
      ...prev,
      [providerKey]: { ...prev[providerKey], loading: true },
    }));

    try {
      const models = providerKey === 'ollama'
        ? await fetchOllamaModels()
        : await fetchLMStudioModels();

      setLocalProviderStatus(prev => ({
        ...prev,
        [providerKey]: { running: models.length > 0, loading: false },
      }));

      if (models.length > 0) {
        setProviders(prev => prev.map(p =>
          p.key === providerKey ? { ...p, models } : p
        ));

        // If this is the currently selected provider, update the model
        if (provider === providerKey) {
          setModel(models[0].value);
        }
      }
    } catch (error) {
      setLocalProviderStatus(prev => ({
        ...prev,
        [providerKey]: { running: false, loading: false },
      }));
    }
  };

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
          <div className="relative" ref={providerDropdownRef}>
            <button
              type="button"
              onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Image
                  src={`/series_icon/light/${providerIconMap[provider]}.svg`}
                  alt={currentProvider?.name || provider}
                  width={20}
                  height={20}
                  className="dark:hidden"
                />
                <Image
                  src={`/series_icon/dark/${providerIconMap[provider]}.svg`}
                  alt={currentProvider?.name || provider}
                  width={20}
                  height={20}
                  className="hidden dark:block"
                />
                <span>{currentProvider?.name || provider}</span>
                {/* Connection status indicator for local providers */}
                {currentProvider?.isLocal && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      localProviderStatus[provider]?.running
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                    title={localProviderStatus[provider]?.running ? 'Connected' : 'Not running'}
                  />
                )}
              </div>
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${providerDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {providerDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                {providers.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setProvider(p.key as Provider);
                      setProviderDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 first:rounded-t-md last:rounded-b-md"
                  >
                    <Image
                      src={`/series_icon/light/${providerIconMap[p.key]}.svg`}
                      alt={p.name}
                      width={20}
                      height={20}
                      className="dark:hidden"
                    />
                    <Image
                      src={`/series_icon/dark/${providerIconMap[p.key]}.svg`}
                      alt={p.name}
                      width={20}
                      height={20}
                      className="hidden dark:block"
                    />
                    <span className="text-gray-900 dark:text-white flex-1">{p.name}</span>
                    {/* Connection status indicator for local providers */}
                    {p.isLocal && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          localProviderStatus[p.key]?.running
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                        title={localProviderStatus[p.key]?.running ? 'Connected' : 'Not running'}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model *
          </label>
          <div className="flex gap-2">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={currentProvider?.isLocal && !localProviderStatus[provider]?.running}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentProvider?.isLocal && !localProviderStatus[provider]?.running ? (
                <option value="">Service not running</option>
              ) : currentProvider?.models && currentProvider.models.length > 0 ? (
                currentProvider.models.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))
              ) : (
                <option value={getDefaultModel(provider)}>
                  {getDefaultModel(provider) || 'No models available'}
                </option>
              )}
            </select>
            {/* Refresh button for local providers */}
            {currentProvider?.isLocal && (
              <button
                type="button"
                onClick={() => refreshLocalProviderModels(provider as 'ollama' | 'lmstudio')}
                disabled={localProviderStatus[provider]?.loading}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Refresh models"
              >
                {localProviderStatus[provider]?.loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            )}
          </div>
          {/* Help text for local providers when service is not running */}
          {currentProvider?.isLocal && !localProviderStatus[provider]?.running && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {provider === 'ollama'
                ? 'Start Ollama with: ollama serve'
                : 'Open LM Studio and enable the local server'}
            </p>
          )}
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
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
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
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
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
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
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
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
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
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
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
