'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadApiKeys, loadColumns, saveColumns } from '@/lib/storage';
import { ApiKeys, AIOutput } from '@/lib/types';
import { PROVIDERS, getDefaultModel, ProviderConfig } from '@/lib/config';
import { fetchOpenRouterModels, getOpenAIModels, getAnthropicModels, getPopularOpenRouterModels, getGeminiModels } from '@/lib/fetch-models';
import { trackEvent } from '@/lib/analytics';
import { apiClient, isApiError } from '@/lib/api';
import ThreePanelLayout from '@/components/layout/three-panel-layout';
import Sidebar from '@/components/collections/sidebar';
import RequestPanel from '@/components/request/request-panel';
import ResponsePanel from '@/components/response/response-panel';

export default function Home() {
  // State management
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'openrouter' | 'gemini'>('openai');
  const [model, setModel] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [output, setOutput] = useState<AIOutput | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [providers, setProviders] = useState<ProviderConfig[]>(PROVIDERS);

  // Initialize on mount
  useEffect(() => {
    // Load API keys
    setApiKeys(loadApiKeys());

    // Set default model for initial provider
    setModel(getDefaultModel('openai'));

    // Load dynamic models from OpenRouter API
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

        // Update model if needed
        const providerConfig = updatedProviders.find(p => p.key === provider);
        if (providerConfig?.models && providerConfig.models.length > 0 && !model) {
          setModel(providerConfig.models[0].value);
        }
      }
    }

    loadModels();
  }, []);

  // Update model when provider changes
  useEffect(() => {
    const providerConfig = providers.find(p => p.key === provider);
    if (providerConfig) {
      // Use first available model or default
      const firstModel = providerConfig.models && providerConfig.models.length > 0
        ? providerConfig.models[0].value
        : getDefaultModel(provider);
      setModel(firstModel);
    }
  }, [provider, providers]);

  // Handle generation
  const handleSend = async () => {
    if (!prompt.trim() || !model || !apiKeys[provider]) {
      // Show error if no API key
      if (!apiKeys[provider]) {
        setOutput({
          id: uuidv4(),
          modelConfig: { provider, model, label: provider },
          type: 'text',
          content: '',
          error: `Please configure your ${provider.toUpperCase()} API key in Settings`,
          timestamp: Date.now(),
        });
      }
      return;
    }

    setIsGenerating(true);
    setOutput(undefined);

    const outputId = uuidv4();
    const providerConfig = providers.find(p => p.key === provider);

    // Detect if this is an image generation model
    const isImageModel = model.toLowerCase().includes('dall-e') ||
                         model.toLowerCase().includes('stable-diffusion') ||
                         model.toLowerCase().includes('imagen') ||
                         (model.toLowerCase().includes('image') && model.toLowerCase().includes('gemini'));

    try {
      let data;

      if (isImageModel) {
        data = await apiClient.generateImage({
          prompt,
          provider,
          model,
          apiKey: apiKeys[provider],
        });
      } else {
        data = await apiClient.generateText({
          prompt,
          provider,
          model,
          apiKey: apiKeys[provider],
        });
      }

      if (isApiError(data)) {
        // Error response
        setOutput({
          id: outputId,
          modelConfig: { provider, model, label: providerConfig?.name || provider },
          type: isImageModel ? 'image' : 'text',
          content: '',
          error: data.error,
          timestamp: Date.now(),
        });
      } else if (isImageModel && 'imageUrl' in data) {
        // Image generation response
        setOutput({
          id: outputId,
          modelConfig: { provider, model, label: providerConfig?.name || provider },
          type: 'image',
          content: data.revisedPrompt || prompt,
          imageUrl: data.imageUrl,
          latency: data.latency,
          timestamp: Date.now(),
        });
      } else if (!isImageModel && 'content' in data) {
        // Text generation response
        setOutput({
          id: outputId,
          modelConfig: { provider, model, label: providerConfig?.name || provider },
          type: 'text',
          content: data.content,
          tokens: data.tokens,
          latency: data.latency,
          timestamp: Date.now(),
        });
      }

      // Track analytics
      trackEvent('generate', {
        provider,
        model,
        type: isImageModel ? 'image' : 'text',
      });
    } catch (error: any) {
      setOutput({
        id: outputId,
        modelConfig: { provider, model, label: providerConfig?.name || provider },
        type: isImageModel ? 'image' : 'text',
        content: '',
        error: error.message || 'Network error',
        timestamp: Date.now(),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Sidebar handlers (placeholder for Phase 2)
  const handleRequestSelect = (requestId: string) => {
    console.log('Request selected:', requestId);
    // TODO: Load request from collection in Phase 2
  };

  const handleNewRequest = () => {
    // Clear current request
    setPrompt('');
    setOutput(undefined);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Navigation stays at top */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Evvl
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <a
                href="/history"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                History
              </a>
              <a
                href="/settings"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Settings
              </a>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            AI Model Testing & Evaluation
          </div>
        </div>
      </nav>

      {/* Three-panel layout */}
      <div className="flex-1 overflow-hidden">
        <ThreePanelLayout
          sidebar={
            <Sidebar
              onRequestSelect={handleRequestSelect}
              onNewRequest={handleNewRequest}
            />
          }
          requestPanel={
            <RequestPanel
              prompt={prompt}
              onPromptChange={setPrompt}
              provider={provider}
              model={model}
              onProviderChange={setProvider}
              onModelChange={setModel}
              onSend={handleSend}
              isGenerating={isGenerating}
            />
          }
          responsePanel={
            <ResponsePanel
              output={output}
              isGenerating={isGenerating}
            />
          }
        />
      </div>
    </div>
  );
}
