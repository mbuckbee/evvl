/**
 * Fetch models from AIML API and OpenRouter
 *
 * ARCHITECTURE CHANGE (Jan 2026):
 * We now use AIML API (https://api.aimlapi.com/models) as the source for direct providers
 * (OpenAI, Anthropic, Gemini) instead of OpenRouter. This change was made because:
 *
 * 1. OpenRouter frequently changes model slugs, causing constant mapping issues
 *    Example: OpenRouter uses "gpt-5-image" but OpenAI API expects "gpt-image-1"
 *
 * 2. OpenRouter adds variant models that don't exist in direct APIs
 *    Example: "o3-mini-high" is OpenRouter-specific, not in OpenAI API
 *
 * 3. AIML API provides more stable model names closer to actual provider APIs
 *    This reduces the need for complex mapping tables
 *
 * 4. We still use OpenRouter for the OpenRouter provider itself
 *
 * For more context, see the refactoring discussion in the commit history.
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

// AIML API model interface (used for direct providers: OpenAI, Anthropic, Gemini)
// The AIML API returns rich metadata including developer, context length, features, etc.
// Response format: {object: "list", data: [AIMLModel, AIMLModel, ...]}
export interface AIMLModel {
  id: string;
  type: string;
  info: {
    name: string;
    developer: string;  // Used to filter by provider (e.g., "Open AI", "Anthropic", "Google")
    description: string;
    contextLength: number;
    maxTokens: number;
    url: string;
    docs_url: string;
  };
  features: string[];
  endpoints: string[];
}

/**
 * Fetch models from AIML API via our proxy endpoint
 * This is our primary source for OpenAI, Anthropic, and Gemini models
 * Uses server-side proxy to avoid CORS issues
 */
export async function fetchAIMLModels(): Promise<AIMLModel[]> {
  try {
    console.log('[AIML] Fetching models from AIML API via proxy...');
    const response = await fetch('/api/aiml-models');

    if (!response.ok) {
      console.error('[AIML] Failed to fetch:', response.status, response.statusText);
      throw new Error(`Failed to fetch models from AIML API: ${response.status}`);
    }

    const models: AIMLModel[] = await response.json();
    console.log(`[AIML] Fetched ${models.length} models from AIML API`);

    // Log developer counts for debugging
    const developerCounts = models.reduce((acc, model) => {
      acc[model.info.developer] = (acc[model.info.developer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('[AIML] Models by developer:', developerCounts);

    return models;
  } catch (error) {
    console.error('[AIML] Error fetching AIML models:', error);
    return [];
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
 * Get OpenAI models from AIML API
 * Filters and formats models for OpenAI provider
 *
 * Supported types:
 * - 'chat-completion': Standard chat models (GPT-4o, GPT-5, etc.) via Chat Completions API
 * - 'responses': Reasoning/deep research models via Responses API
 * - 'language-completion': Legacy completion models
 * - 'image': Image generation models (added separately with hardcoded list)
 *
 * Excluded:
 * - 'video', 'audio', 'stt', 'tts', 'embedding', 'document': Need specialized endpoints we don't support
 * - Models starting with 'fallback-': Proxy/fallback variants we don't need to test
 * - Models with '-oss-' or 'gpt-oss-': Open-source models not in OpenAI API
 * - Models ending with '-high': OpenRouter-exclusive reasoning variants
 *
 * Sorted in descending order (newer versions first)
 * Returns models with type information from AIML API
 */
export function getOpenAIModels(models: AIMLModel[]) {
  console.log(`[getOpenAIModels] Input: ${models.length} models`);

  const textModels = models
    // Filter for OpenAI models only (note: "Open AI" with space in AIML API)
    .filter(model => model.info.developer === 'Open AI')
    // Filter out excluded models (realtime, tts, etc.) - same as backroom validation
    .filter(model => !isModelExcluded(model.id))
    // Filter out OSS models - these are open-source models, not actual OpenAI API models
    .filter(model => !model.id.includes('gpt-oss-') && !model.id.includes('-oss-'))
    // Filter out OpenRouter-exclusive reasoning effort variants ending in -high
    .filter(model => !model.id.includes('-high'))
    // Filter out fallback variants (proxy models we don't need to test)
    .filter(model => !model.id.startsWith('fallback-'))
    // Filter out image generation models (they'll be added separately)
    .filter(model => model.type !== 'image')
    // Filter out unsupported types: video, audio, stt, tts, embedding, document
    // These need specialized endpoints we don't support yet
    // Only include: 'chat-completion', 'responses', 'language-completion'
    .filter(model => model.type === 'chat-completion' ||
                     model.type === 'responses' ||
                     model.type === 'language-completion')
    .map(model => ({
      // Use the AIML ID as-is (it already has the correct format with prefix)
      value: model.id,
      label: model.info.name,
      type: model.type, // Pass through AIML type: 'chat-completion', 'responses', etc.
    }))
    .sort((a, b) => b.label.localeCompare(a.label));

  console.log(`[getOpenAIModels] Filtered to ${textModels.length} text models`);

  // Add DALL-E and GPT Image models (always available for image generation)
  const imageModels = [
    { value: 'openai/gpt-image-1', label: 'GPT Image 1 (Image Generation)', type: 'image' },
    { value: 'openai/gpt-image-1-mini', label: 'GPT Image 1 Mini (Image Generation)', type: 'image' },
    { value: 'openai/gpt-image-1-5', label: 'GPT Image 1.5 (Image Generation)', type: 'image' },
    { value: 'dall-e-3', label: 'DALL-E 3 (Image Generation)', type: 'image' },
    { value: 'dall-e-2', label: 'DALL-E 2 (Image Generation)', type: 'image' },
  ];

  return [...imageModels, ...textModels];
}

/**
 * Get Anthropic models from AIML API
 * Filters out RETIRED Claude models (as of Dec 2025)
 * Shows active AND deprecated models (deprecated still work until retirement date)
 *
 * Only includes models that work with Anthropic's Messages API (/v1/messages)
 * Excludes: image, video, audio, responses types (not supported by Messages API)
 *
 * Sorted in descending order (newer versions first)
 * Returns models with type information from AIML API
 */
export function getAnthropicModels(models: AIMLModel[]) {
  return models
    // Filter for Anthropic models only
    .filter(model => model.info.developer === 'Anthropic')
    // Filter out excluded models - same as backroom validation
    .filter(model => !isModelExcluded(model.id))
    // Filter to only chat-capable models
    .filter(model => model.type === 'chat-completion' || model.type === 'language-completion')
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
      // Anthropic IDs in AIML are already correct (no prefix needed)
      value: model.id,
      label: model.info.name,
      type: model.type, // Pass through AIML type
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
 * Get Google Gemini models from AIML API
 * Includes both text and image generation models (Gemini, Imagen)
 * Excludes Gemma models (open-source models, not available through Gemini API)
 *
 * Only includes models that work with Gemini's text/image generation endpoints
 * Excludes: video, audio, responses types (not supported by current implementation)
 *
 * Sorted in descending order (newer versions first)
 * Returns models with type information from AIML API
 */
export function getGeminiModels(models: AIMLModel[]) {
  return models
    // Filter for Google models only
    .filter(model => model.info.developer === 'Google')
    // Filter out excluded models (computer-use, native-audio, tts, etc.) - same as backroom validation
    .filter(model => !isModelExcluded(model.id))
    // Filter out Gemma models - these are open-source models,
    // not actual Gemini API models
    .filter(model => !model.id.toLowerCase().includes('gemma'))
    // Filter to only supported types
    .filter(model => model.type === 'chat-completion' ||
                     model.type === 'language-completion' ||
                     model.type === 'image')
    .map(model => ({
      // Google IDs in AIML already have the google/ prefix
      value: model.id,
      label: model.info.name,
      type: model.type, // Pass through AIML type
    }))
    .sort((a, b) => b.label.localeCompare(a.label));
}
