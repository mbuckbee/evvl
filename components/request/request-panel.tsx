'use client';

import { useState, useEffect } from 'react';
import { PaperAirplaneIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { PROVIDERS, getDefaultModel } from '@/lib/config';

interface RequestPanelProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  provider?: 'openai' | 'anthropic' | 'openrouter' | 'gemini';
  model?: string;
  onProviderChange: (provider: 'openai' | 'anthropic' | 'openrouter' | 'gemini') => void;
  onModelChange: (model: string) => void;
  onSend: () => void;
  isGenerating?: boolean;
  compareMode?: boolean;
  onCompareModeToggle?: () => void;
}

export default function RequestPanel({
  prompt,
  onPromptChange,
  provider = 'openai',
  model,
  onProviderChange,
  onModelChange,
  onSend,
  isGenerating = false,
  compareMode = false,
  onCompareModeToggle,
}: RequestPanelProps) {
  const [availableModels, setAvailableModels] = useState<{ label: string; value: string }[]>([]);

  // Get models for selected provider
  useEffect(() => {
    const providerConfig = PROVIDERS.find(p => p.key === provider);
    if (providerConfig) {
      // For Phase 1, use placeholder models
      // In Phase 3, we'll fetch real models from OpenRouter API
      const models = [
        { label: getDefaultModel(provider), value: getDefaultModel(provider) },
      ];
      setAvailableModels(models);

      // Set default model if none selected
      if (!model && models.length > 0) {
        onModelChange(models[0].value);
      }
    }
  }, [provider, model, onModelChange]);

  const handleSend = () => {
    if (prompt.trim() && model && !isGenerating) {
      onSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Prompt
          </h2>
          <div className="flex items-center gap-2">
            {/* Compare Mode Toggle (placeholder for Phase 4) */}
            {onCompareModeToggle && (
              <button
                onClick={onCompareModeToggle}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  compareMode
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {compareMode ? 'Compare Mode' : 'Single Mode'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Enter your prompt here..."
          className="flex-1 w-full p-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
        />
      </div>

      {/* Model Selection */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Provider Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => onProviderChange(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {PROVIDERS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model
            </label>
            <select
              value={model || ''}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={availableModels.length === 0}
            >
              {availableModels.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Parameters (placeholder for Phase 3) */}
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white select-none">
            <Cog6ToothIcon className="h-4 w-4" />
            <span>Advanced Parameters</span>
            <span className="ml-auto text-xs text-gray-500">(Coming in Phase 3)</span>
          </summary>
          <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-900 rounded-md text-sm text-gray-600 dark:text-gray-400">
            Temperature, Max Tokens, Top P, and other advanced parameters will be available in Phase 3.
          </div>
        </details>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!prompt.trim() || !model || isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="h-4 w-4" />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
