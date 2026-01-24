/**
 * Fetch models from provider APIs
 *
 * ARCHITECTURE (Jan 2026):
 * We fetch models directly from each provider's API via our /api/provider-models endpoint.
 * This endpoint uses server-side API keys and caches results for 1 hour.
 *
 * Benefits:
 * 1. Authoritative model lists directly from providers (OpenAI, Anthropic, Gemini)
 * 2. No external dependency on third-party aggregators
 * 3. Server-side caching with Next.js data cache
 * 4. Consistent model IDs that match actual provider APIs
 *
 * OpenRouter is fetched separately since it's a provider in its own right.
 */

import { EXCLUDED_MODEL_PATTERNS } from './validation/types';

/**
 * Check if a model should be excluded from the user-facing app
 * Uses the same patterns as the backroom validation dashboard
 */
function isModelExcluded(modelId: string): boolean {
  return EXCLUDED_MODEL_PATTERNS.some(pattern => pattern.test(modelId));
}

// OpenRouter model interface (still used for OpenRouter provider)
export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

interface ModelsResponse {
  models: OpenRouterModel[];
  cached?: boolean;
  cacheAge?: number;
  stale?: boolean;
  error?: string;
}

// Provider model from our /api/provider-models endpoint
export interface ProviderModel {
  id: string;
  displayName: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
  type: string;
  created?: number;
}

// Response from /api/provider-models
export interface ProviderModelsResponse {
  success: boolean;
  providers: {
    openai: { available: boolean; models: ProviderModel[]; error?: string };
    anthropic: { available: boolean; models: ProviderModel[]; error?: string };
    gemini: { available: boolean; models: ProviderModel[]; error?: string };
    openrouter: { available: boolean; models: ProviderModel[]; error?: string };
  };
  cachedAt: number;
}

/**
 * Fetch models from our /api/provider-models endpoint
 * This fetches from all providers using server-side API keys
 * Returns structured response with models organized by provider
 */
export async function fetchProviderModels(): Promise<ProviderModelsResponse | null> {
  try {
    console.log('[Provider Models] Fetching from /api/provider-models...');
    const response = await fetch('/api/provider-models');

    if (!response.ok) {
      console.error('[Provider Models] Failed to fetch:', response.status, response.statusText);
      throw new Error(`Failed to fetch provider models: ${response.status}`);
    }

    const data: ProviderModelsResponse = await response.json();

    // Log model counts for debugging
    const counts = {
      openai: data.providers.openai.models.length,
      anthropic: data.providers.anthropic.models.length,
      gemini: data.providers.gemini.models.length,
      openrouter: data.providers.openrouter.models.length,
    };
    console.log('[Provider Models] Fetched models:', counts);

    return data;
  } catch (error) {
    console.error('[Provider Models] Error fetching:', error);
    return null;
  }
}

/**
 * Fetch models from our API endpoint (with 5-minute cache)
 * Falls back to static cache if API fails
 * NOW ONLY USED FOR OPENROUTER PROVIDER
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch('/api/models');

    if (!response.ok) {
      throw new Error('Failed to fetch models from API');
    }

    const data: ModelsResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.models;
  } catch (error) {
    console.error('Error fetching models, using fallback:', error);

    // Fallback to static cache
    try {
      const modelsCache = await import('./models-cache.json');
      return modelsCache.models || [];
    } catch {
      console.error('Failed to load fallback cache');
      return [];
    }
  }
}

/**
 * Filter models by provider prefix
 */
export function filterModelsByProvider(models: OpenRouterModel[], prefix: string): OpenRouterModel[] {
  return models.filter(model => model.id.startsWith(prefix + '/'));
}

/**
 * Get OpenAI models from provider models response
 * Filters and formats models for OpenAI provider
 *
 * Supported types from discovery:
 * - 'chat-completion': Standard chat models (GPT-4o, GPT-5, etc.) via Chat Completions API
 * - 'responses': Reasoning/deep research models (o1, o3) via Responses API
 * - 'image': Image generation models (DALL-E, GPT Image)
 *
 * Excluded via EXCLUDED_MODEL_PATTERNS:
 * - realtime, tts, audio, embedding, moderation models
 *
 * Sorted in descending order (newer versions first)
 */
export function getOpenAIModels(models: ProviderModel[]) {
  console.log(`[getOpenAIModels] Input: ${models.length} models`);

  const filteredModels = models
    // Filter out excluded models (realtime, tts, etc.) - same as backroom validation
    .filter(model => !isModelExcluded(model.id))
    // Only include chat, responses, and image models
    .filter(model =>
      model.type === 'chat-completion' ||
      model.type === 'chat' ||
      model.type === 'responses' ||
      model.type === 'image'
    )
    .map(model => ({
      value: model.id,
      label: model.displayName,
      type: model.type,
    }))
    .sort((a, b) => b.label.localeCompare(a.label));

  console.log(`[getOpenAIModels] Filtered to ${filteredModels.length} models`);

  return filteredModels;
}

/**
 * Get Anthropic models from provider models response
 * Filters out RETIRED Claude models (as of Dec 2025)
 * Shows active AND deprecated models (deprecated still work until retirement date)
 *
 * Sorted in descending order (newer versions first)
 */
export function getAnthropicModels(models: ProviderModel[]) {
  return models
    // Filter out excluded models - same as backroom validation
    .filter(model => !isModelExcluded(model.id))
    // Only include chat models (Anthropic discovery returns 'chat' type)
    .filter(model => model.type === 'chat' || model.type === 'chat-completion')
    .filter(model => {
      const modelId = model.id.toLowerCase();

      // Block RETIRED models only (these no longer work):
      // - Claude 2.x (retired July 21, 2025)
      // - Claude 3 Sonnet (retired July 21, 2025)
      // - Claude 3.5 Sonnet (retired Oct 28, 2025)
      if (modelId.includes('claude-2.0') ||
          modelId.includes('claude-2.1') ||
          modelId.includes('claude-3-sonnet-') ||
          modelId.includes('claude-3.5-sonnet') ||
          modelId.includes('claude-3-5-sonnet')) {
        return false;
      }

      return true;
    })
    .map(model => ({
      value: model.id,
      label: model.displayName,
      type: model.type,
    }))
    .sort((a, b) => b.label.localeCompare(a.label));
}

/**
 * Get popular models for OpenRouter provider
 * Sorted in descending order (newer versions first)
 */
export function getPopularOpenRouterModels(models: OpenRouterModel[]) {
  const popularPrefixes = [
    'openai/',
    'anthropic/',
    'google/',
    'meta-llama/',
    'mistralai/',
    'deepseek/',
    'qwen/',
  ];

  return models
    .filter(model =>
      popularPrefixes.some(prefix => model.id.startsWith(prefix))
    )
    // Filter out excluded models - same as backroom validation
    .filter(model => !isModelExcluded(model.id))
    .map(model => ({
      value: model.id,
      label: model.name.split(': ')[1] || model.name,
    }))
    .sort((a, b) => b.label.localeCompare(a.label));
}

/**
 * Fetch models from local Ollama instance
 * Returns empty array if Ollama is not running
 */
export async function fetchOllamaModels(): Promise<{ value: string; label: string }[]> {
  try {
    const ollama = await import('@/lib/providers/ollama-fetch');
    const models = await ollama.listModels();
    return models.map(model => ({
      value: model.name,
      label: model.name,
    }));
  } catch (error) {
    console.log('[Ollama] Not running or error fetching models:', error);
    return [];
  }
}

/**
 * Fetch models from local LM Studio instance
 * Returns empty array if LM Studio is not running
 */
export async function fetchLMStudioModels(): Promise<{ value: string; label: string }[]> {
  try {
    const lmstudio = await import('@/lib/providers/lmstudio-fetch');
    const models = await lmstudio.listModels();
    return models.map(model => ({
      value: model.id,
      label: model.id,
    }));
  } catch (error) {
    console.log('[LM Studio] Not running or error fetching models:', error);
    return [];
  }
}

/**
 * Get Google Gemini models from provider models response
 * Includes both text and image generation models (Gemini, Imagen)
 *
 * Sorted in descending order (newer versions first)
 */
export function getGeminiModels(models: ProviderModel[]) {
  return models
    // Filter out excluded models - same as backroom validation
    .filter(model => !isModelExcluded(model.id))
    // Only include chat and image models
    .filter(model =>
      model.type === 'chat' ||
      model.type === 'chat-completion' ||
      model.type === 'image'
    )
    .map(model => ({
      value: model.id,
      label: model.displayName,
      type: model.type,
    }))
    .sort((a, b) => b.label.localeCompare(a.label));
}
