'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadApiKeys, loadColumns, saveColumns, loadEvalHistory, saveEvalResult, ColumnConfig } from '@/lib/storage';
import { ApiKeys, AIOutput } from '@/lib/types';
import { PROVIDERS, getDefaultModel, ProviderConfig, ModelOption } from '@/lib/config';
import { fetchOpenRouterModels, getOpenAIModels, getAnthropicModels, getPopularOpenRouterModels, getGeminiModels } from '@/lib/fetch-models';
import { trackEvent } from '@/lib/analytics';
import Link from 'next/link';
import Image from 'next/image';

interface Column {
  id: string;
  provider?: 'openai' | 'anthropic' | 'openrouter' | 'gemini';
  model?: string;
  isConfiguring?: boolean;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [columns, setColumns] = useState<Column[]>([
    { id: uuidv4(), provider: 'openai', model: getDefaultModel('openai'), isConfiguring: true },
    { id: uuidv4(), provider: 'anthropic', model: getDefaultModel('anthropic'), isConfiguring: true },
    { id: uuidv4(), isConfiguring: false },
  ]);
  const [outputs, setOutputs] = useState<Record<string, AIOutput>>({});
  const [providers, setProviders] = useState<ProviderConfig[]>(PROVIDERS);
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Load saved columns from localStorage after mount
    const saved = loadColumns();
    if (saved && saved.length > 0) {
      // Keep columns as-is from localStorage, no forced normalization
      const loadedColumns = [...saved];

      // Always ensure there's a placeholder "Add Comparison" column at the end
      const hasPlaceholder = loadedColumns.some(col => !col.provider && !col.isConfiguring);
      if (!hasPlaceholder) {
        loadedColumns.push({ id: uuidv4(), isConfiguring: false });
      }

      setColumns(loadedColumns);
    }

    setApiKeys(loadApiKeys());

    // Load last used prompt from eval history
    const history = loadEvalHistory();
    if (history.length > 0) {
      setPrompt(history[0].prompt);
    }

    // Load dynamic models from API (with 5-minute cache)
    async function loadModels() {
      const models = await fetchOpenRouterModels();

      if (models.length > 0) {
        const openaiModels = getOpenAIModels(models);
        const anthropicModels = getAnthropicModels(models);
        const openrouterModels = getPopularOpenRouterModels(models);
        const geminiModels = getGeminiModels(models);

        const updatedProviders = PROVIDERS.map(provider => {
          if (provider.key === 'openai' && openaiModels.length > 0) {
            return { ...provider, models: openaiModels };
          } else if (provider.key === 'anthropic' && anthropicModels.length > 0) {
            return { ...provider, models: anthropicModels };
          } else if (provider.key === 'openrouter' && openrouterModels.length > 0) {
            return { ...provider, models: openrouterModels };
          } else if (provider.key === 'gemini' && geminiModels.length > 0) {
            return { ...provider, models: geminiModels };
          }
          return provider;
        });

        setProviders(updatedProviders);

        // Update any columns that have a provider but no model (empty string)
        setColumns(prevColumns => prevColumns.map(col => {
          if (col.provider && !col.model) {
            const providerConfig = updatedProviders.find(p => p.key === col.provider);
            const firstModel = providerConfig?.models[0]?.value;
            if (firstModel) {
              return { ...col, model: firstModel, isConfiguring: false };
            }
          }
          return col;
        }));
      }
    }

    loadModels();

    // CRITICAL: Only enable saving after a delay to ensure state has updated
    setTimeout(() => {
      hasLoadedRef.current = true;
    }, 100);
  }, []);

  // Save columns to localStorage whenever they change (but not on initial mount)
  useEffect(() => {
    if (hasLoadedRef.current) {
      saveColumns(columns);
    }
  }, [columns]);

  const removeColumn = (id: string) => {
    // Don't allow removing all columns - keep at least the "Add Comparison" column
    const configuredColumns = columns.filter(col => col.provider);
    if (configuredColumns.length > 0 || columns.length > 1) {
      setColumns(columns.filter(col => col.id !== id));
      // Remove output for this column
      const newOutputs = { ...outputs };
      delete newOutputs[id];
      setOutputs(newOutputs);
    }
  };

  const generateForColumn = async (columnId: string, columnProvider: 'openai' | 'anthropic' | 'openrouter' | 'gemini', columnModel: string) => {
    if (!prompt.trim() || !apiKeys[columnProvider]) return;

    // Mark this column as loading
    setLoadingColumns(prev => new Set(prev).add(columnId));

    const outputId = uuidv4();
    const providerConfig = providers.find(p => p.key === columnProvider);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          provider: columnProvider,
          model: columnModel,
          apiKey: apiKeys[columnProvider],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOutputs(prev => ({
          ...prev,
          [columnId]: {
            id: outputId,
            modelConfig: { provider: columnProvider, model: columnModel, label: providerConfig?.name || columnProvider },
            content: data.content,
            tokens: data.tokens,
            latency: data.latency,
            timestamp: Date.now(),
          }
        }));
      } else {
        setOutputs(prev => ({
          ...prev,
          [columnId]: {
            id: outputId,
            modelConfig: { provider: columnProvider, model: columnModel, label: providerConfig?.name || columnProvider },
            content: '',
            error: data.error || 'Failed to generate',
            timestamp: Date.now(),
          }
        }));
      }
    } catch (error: any) {
      setOutputs(prev => ({
        ...prev,
        [columnId]: {
          id: outputId,
          modelConfig: { provider: columnProvider, model: columnModel, label: providerConfig?.name || columnProvider },
          content: '',
          error: error.message || 'Network error',
          timestamp: Date.now(),
        }
      }));
    } finally {
      // Remove this column from loading
      setLoadingColumns(prev => {
        const next = new Set(prev);
        next.delete(columnId);
        return next;
      });
    }
  };

  const configureColumn = (id: string, provider: 'openai' | 'anthropic' | 'openrouter' | 'gemini', model: string) => {
    // Update the column configuration
    const updatedColumns = columns.map(col =>
      col.id === id ? { ...col, provider, model, isConfiguring: false } : col
    );

    // Only add a new "Add Comparison" column if there isn't already one
    const hasPlaceholder = updatedColumns.some(col => !col.provider && !col.isConfiguring);
    if (!hasPlaceholder) {
      updatedColumns.push({ id: uuidv4(), isConfiguring: false });
    }

    setColumns(updatedColumns);

    // Clear old output for this column to avoid showing stale data/errors
    setOutputs(prev => {
      const newOutputs = { ...prev };
      delete newOutputs[id];
      return newOutputs;
    });

    // Auto-generate if there's a prompt
    if (prompt.trim()) {
      generateForColumn(id, provider, model);
    }
  };

  const toggleConfiguring = (id: string) => {
    setColumns(columns.map(col =>
      col.id === id ? { ...col, isConfiguring: !col.isConfiguring } : col
    ));
  };

  const startConfiguring = (id: string) => {
    setColumns(columns.map(col =>
      col.id === id ? { ...col, isConfiguring: true } : col
    ));
  };

  const clearPromptAndResponses = () => {
    setPrompt('');
    setOutputs({});
  };

  const generateOutputs = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setOutputs({});
    setLoadingColumns(new Set()); // Clear individual column loading states

    // Filter columns that are configured and have API keys
    const configuredColumns = columns.filter(col => col.provider && col.model && apiKeys[col.provider]);

    const promises = configuredColumns.map(async (column) => {
      const provider = column.provider!;
      const model = column.model!;
      const apiKey = apiKeys[provider]!;
      const outputId = uuidv4();
      const providerConfig = providers.find(p => p.key === provider);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            provider,
            model,
            apiKey,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Track successful generation
          trackEvent('generation_success', { provider, model });

          return {
            columnId: column.id,
            output: {
              id: outputId,
              modelConfig: { provider, model, label: providerConfig?.name || provider },
              content: data.content,
              tokens: data.tokens,
              latency: data.latency,
              timestamp: Date.now(),
            }
          };
        } else {
          // Track generation error
          trackEvent('generation_error', { provider, model, error_type: 'api_error' });

          return {
            columnId: column.id,
            output: {
              id: outputId,
              modelConfig: { provider, model, label: providerConfig?.name || provider },
              content: '',
              error: data.error || 'Failed to generate',
              timestamp: Date.now(),
            }
          };
        }
      } catch (error: any) {
        // Track generation error
        trackEvent('generation_error', { provider, model, error_type: 'network_error' });

        return {
          columnId: column.id,
          output: {
            id: outputId,
            modelConfig: { provider, model, label: providerConfig?.name || provider },
            content: '',
            error: error.message || 'Network error',
            timestamp: Date.now(),
          }
        };
      }
    });

    const results = await Promise.all(promises);
    const newOutputs: Record<string, AIOutput> = {};
    results.forEach(({ columnId, output }) => {
      newOutputs[columnId] = output;
    });

    setOutputs(newOutputs);
    setGenerating(false);

    // Save to eval history so prompt persists
    const evalResult = {
      id: uuidv4(),
      prompt,
      outputs: Object.values(newOutputs),
      ratings: [],
      timestamp: Date.now(),
    };
    saveEvalResult(evalResult);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Prompt Section - Fixed at top */}
      <div className="w-[80%] mx-auto px-4 py-12 flex-shrink-0">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="prompt" className="text-sm font-semibold text-gray-700">
              Enter Prompt Here
            </label>
            <button
              onClick={clearPromptAndResponses}
              disabled={generating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear Prompt and Responses
            </button>
          </div>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            rows={5}
            className="input resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={generateOutputs}
            disabled={generating || !prompt.trim()}
            className="btn-primary"
          >
            {generating ? 'Generating...' : 'Save and Refresh'}
          </button>
        </div>
      </div>

      {/* Dynamic Columns Layout - Horizontally scrollable */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="flex gap-6 px-4 pb-12 min-h-full" style={{ width: 'max-content', minWidth: '100%' }}>
          {columns.map((column) => (
            <div key={column.id} style={{ minWidth: '350px', width: '350px' }}>
              <ColumnComponent
                column={column}
                apiKeys={apiKeys}
                output={outputs[column.id]}
                generating={generating || loadingColumns.has(column.id)}
                providers={providers}
                onConfigure={configureColumn}
                onToggleConfiguring={toggleConfiguring}
                onStartConfiguring={startConfiguring}
                onRemove={removeColumn}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ColumnComponentProps {
  column: Column;
  apiKeys: ApiKeys;
  output?: AIOutput;
  generating: boolean;
  providers: ProviderConfig[];
  onConfigure: (id: string, provider: 'openai' | 'anthropic' | 'openrouter' | 'gemini', model: string) => void;
  onToggleConfiguring: (id: string) => void;
  onStartConfiguring: (id: string) => void;
  onRemove: (id: string) => void;
}

function ColumnComponent({ column, apiKeys, output, generating, providers, onConfigure, onToggleConfiguring, onStartConfiguring, onRemove }: ColumnComponentProps) {
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'openrouter' | 'gemini' | ''>(column.provider || '');
  const [selectedModel, setSelectedModel] = useState(column.model || '');
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const previousConfiguringRef = useRef(column.isConfiguring);

  // Only sync from column props when entering configuration mode, not continuously
  useEffect(() => {
    const wasNotConfiguring = !previousConfiguringRef.current;
    const isNowConfiguring = column.isConfiguring;

    // Only reset selected values when entering configuration mode
    if (wasNotConfiguring && isNowConfiguring && column.provider && column.model) {
      setSelectedProvider(column.provider);
      setSelectedModel(column.model);
    }

    previousConfiguringRef.current = column.isConfiguring;
  }, [column.isConfiguring, column.provider, column.model]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
        setProviderDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    }

    if (providerDropdownOpen || modelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [providerDropdownOpen, modelDropdownOpen]);

  const handleProviderChange = (provider: 'openai' | 'anthropic' | 'openrouter' | 'gemini') => {
    setSelectedProvider(provider);
    const providerConfig = providers.find(p => p.key === provider);
    if (providerConfig) {
      const defaultModel = providerConfig.models[0].value;
      setSelectedModel(defaultModel);
    }
  };

  const handleSaveConfiguration = () => {
    if (selectedProvider && selectedModel) {
      onConfigure(column.id, selectedProvider, selectedModel);
    }
  };

  const providerConfig = column.provider ? providers.find(p => p.key === column.provider) : null;
  const isAuthenticated = column.provider ? !!apiKeys[column.provider] : false;
  const modelLabel = providerConfig?.models.find(m => m.value === column.model)?.label || column.model;

  // For "Add Comparison" placeholder (unconfigured columns)
  if (!column.isConfiguring && !column.provider) {
    return (
      <button
        onClick={() => onStartConfiguring(column.id)}
        className="border-2 border-dashed border-gray-400 rounded-lg p-6 flex items-center justify-center min-h-[300px] w-full hover:border-gray-500 hover:bg-gray-50 transition-colors"
      >
        <div className="text-center">
          <div className="text-gray-600 text-sm font-medium">+ Add Comparison</div>
        </div>
      </button>
    );
  }

  return (
    <div className="card p-6">
      {/* Column Header */}
      {!column.isConfiguring && column.provider && providerConfig ? (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image src={providerConfig.logo} alt={providerConfig.name} width={24} height={24} />
            <div>
              <h3 className="text-base font-bold text-gray-900">{providerConfig.name}</h3>
              <p className="text-xs text-gray-500">{modelLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleConfiguring(column.id)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Configure"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(column.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Remove column"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : column.isConfiguring && column.provider ? (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Add Model Comparison</h3>
        </div>
      ) : null}

      {/* Column Body */}
      {column.isConfiguring ? (
        // Configuration Mode
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative" ref={providerDropdownRef}>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Provider
              </label>
            <button
              type="button"
              onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {selectedProvider ? (
                  <>
                    <Image
                      src={providers.find(p => p.key === selectedProvider)?.logo || ''}
                      alt={providers.find(p => p.key === selectedProvider)?.name || ''}
                      width={20}
                      height={20}
                    />
                    <span>{providers.find(p => p.key === selectedProvider)?.name}</span>
                  </>
                ) : (
                  <span className="text-gray-500">Select</span>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {providerDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {providers.map((provider) => (
                  <button
                    key={provider.key}
                    type="button"
                    onClick={() => {
                      handleProviderChange(provider.key);
                      setProviderDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <Image src={provider.logo} alt={provider.name} width={20} height={20} />
                    <span>{provider.name}</span>
                  </button>
                ))}
              </div>
            )}
            </div>

            {selectedProvider && (
              <div className="relative" ref={modelDropdownRef}>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Version
              </label>
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
              >
                <span>
                  {providers.find(p => p.key === selectedProvider)?.models.find(m => m.value === selectedModel)?.label || 'Select'}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {modelDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {providers.find(p => p.key === selectedProvider)?.models.map((model) => (
                    <button
                      key={model.value}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model.value);
                        setModelDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              )}
              </div>
            )}
          </div>

          <button
            onClick={handleSaveConfiguration}
            disabled={!selectedProvider || !selectedModel}
            className="w-full btn-primary text-sm"
          >
            Save Configuration
          </button>
        </div>
      ) : column.provider && !isAuthenticated ? (
        // Not Authenticated State
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">API key not configured</p>
          <Link
            href="/settings"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Configure {providerConfig?.name} →
          </Link>
        </div>
      ) : output ? (
        // Output Display
        <div>
          <div className="mb-2 text-xs text-gray-500">
            {output.tokens && <span>{output.tokens} tokens</span>}
            {output.latency && <span className="ml-3">{output.latency}ms</span>}
          </div>
          {output.error ? (
            <div className="text-red-600 text-sm">{output.error}</div>
          ) : (
            <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
              {output.content}
            </div>
          )}
        </div>
      ) : generating ? (
        <div className="text-center py-12 text-gray-400">Generating...</div>
      ) : (
        <div className="text-center py-12 text-gray-400">Ready</div>
      )}
    </div>
  );
}
