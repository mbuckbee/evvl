/**
 * Fetch models from API with 5-minute server-side cache
 */

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

/**
 * Fetch models from our API endpoint (with 5-minute cache)
 * Falls back to static cache if API fails
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
 * Get OpenAI models from OpenRouter
 * Sorted in descending order (newer versions first)
 */
export function getOpenAIModels(models: OpenRouterModel[]) {
  return filterModelsByProvider(models, 'openai')
    .map(model => ({
      value: model.id,
      label: model.name.replace('OpenAI: ', ''),
    }))
    .sort((a, b) => b.label.localeCompare(a.label));
}

/**
 * Get Anthropic models from OpenRouter
 * Filters out RETIRED Claude models (as of Dec 2025)
 * Shows active AND deprecated models (deprecated still work until retirement date)
 * Sorted in descending order (newer versions first)
 */
export function getAnthropicModels(models: OpenRouterModel[]) {
  return filterModelsByProvider(models, 'anthropic')
    .filter(model => {
      const modelId = model.id.toLowerCase();

      // Block RETIRED models only (these no longer work):
      // - Claude 2.x (retired July 21, 2025)
      // - Claude 3 Sonnet (retired July 21, 2025)
      // - Claude 3.5 Sonnet (retired Oct 28, 2025)
      if (modelId.includes('claude-2.0') ||
          modelId.includes('claude-2.1') ||
          modelId.includes('claude-3-sonnet-') ||
          modelId.includes('claude-3.5-sonnet')) {
        return false;
      }

      // Allow everything else (active + deprecated):
      // Active:
      // - Claude 3 Haiku
      // - Claude 4.x series
      // - Claude 4.5.x series
      // Deprecated (still work until retirement date):
      // - Claude 3 Opus (retires Jan 5, 2026)
      // - Claude 3.5 Haiku (retires Feb 19, 2026)
      // - Claude 3.7 Sonnet (retires Feb 19, 2026)
      return true;
    })
    .map(model => ({
      value: model.id,
      label: model.name.replace('Anthropic: ', ''),
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
    .map(model => ({
      value: model.id,
      label: model.name.split(': ')[1] || model.name,
    }))
    .sort((a, b) => b.label.localeCompare(a.label));
}
