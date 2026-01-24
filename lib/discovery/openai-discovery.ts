/**
 * OpenAI Model Discovery
 *
 * Uses OpenAI's models.list() API to get authoritative model IDs.
 * Returns canonical model IDs like "gpt-4o", "gpt-4-turbo", "dall-e-3"
 *
 * API Reference: https://platform.openai.com/docs/api-reference/models/list
 */

import OpenAI from 'openai';
import { DiscoveredModel, ProviderDiscoveryResult } from './types';

/**
 * Model prefixes to include in discovery
 * We focus on production-ready models, not fine-tunes or internal models
 */
const INCLUDE_PREFIXES = [
  'gpt-',
  'o1-',
  'o3-',
  'dall-e-',
  'gpt-image',
  'chatgpt-',
  'text-',
  'whisper-',
  'tts-',
];

/**
 * Patterns to exclude from discovery
 */
const EXCLUDE_PATTERNS = [
  /^ft:/,              // Fine-tuned models
  /^ft-/,              // Fine-tuned models (alternate format)
  /^davinci/,          // Legacy models
  /^curie/,            // Legacy models
  /^babbage/,          // Legacy models
  /^ada/,              // Legacy models
  /moderation/i,       // Content moderation
  /-instruct$/,        // Legacy instruct variants
];

/**
 * Determine model type from model ID
 */
function inferModelType(modelId: string): string {
  const lower = modelId.toLowerCase();

  if (lower.includes('dall-e') || lower.includes('gpt-image')) {
    return 'image';
  }
  if (lower.includes('realtime')) {
    return 'realtime';
  }
  if (lower.includes('embedding')) {
    return 'embedding';
  }
  if (lower.includes('whisper')) {
    return 'audio';
  }
  if (lower.includes('tts')) {
    return 'tts';
  }
  if (lower.startsWith('o1-') || lower.startsWith('o3-')) {
    return 'responses';
  }
  return 'chat-completion';
}

/**
 * Discover models from OpenAI's API
 *
 * @param apiKey - OpenAI API key
 * @returns Discovery result with list of models
 */
export async function discoverOpenAIModels(apiKey: string): Promise<ProviderDiscoveryResult> {
  const startTime = Date.now();

  try {
    const openai = new OpenAI({ apiKey });
    const modelsResponse = await openai.models.list();

    const discoveredModels: DiscoveredModel[] = [];

    for await (const model of modelsResponse) {
      const modelId = model.id;

      // Check if model should be included
      const shouldInclude = INCLUDE_PREFIXES.some(prefix =>
        modelId.toLowerCase().startsWith(prefix)
      );

      if (!shouldInclude) {
        continue;
      }

      // Check if model should be excluded
      const shouldExclude = EXCLUDE_PATTERNS.some(pattern =>
        pattern.test(modelId)
      );

      if (shouldExclude) {
        continue;
      }

      discoveredModels.push({
        id: modelId,
        provider: 'openai',
        displayName: modelId, // OpenAI doesn't provide display names
        created: model.created ? model.created * 1000 : undefined, // Convert to ms
        modelType: inferModelType(modelId),
        ownedBy: model.owned_by,
      });
    }

    // Sort by ID (newer models tend to have higher version numbers)
    discoveredModels.sort((a, b) => b.id.localeCompare(a.id));

    console.log(`[OpenAI Discovery] Found ${discoveredModels.length} models`);

    return {
      provider: 'openai',
      success: true,
      models: discoveredModels,
      discoveredAt: startTime,
    };
  } catch (error: any) {
    console.error('[OpenAI Discovery] Error:', error.message);

    return {
      provider: 'openai',
      success: false,
      models: [],
      error: error.message || 'Failed to discover OpenAI models',
      discoveredAt: startTime,
    };
  }
}

/**
 * Get a specific model from OpenAI to verify it exists
 *
 * @param apiKey - OpenAI API key
 * @param modelId - Model ID to check
 * @returns true if model exists, false otherwise
 */
export async function verifyOpenAIModel(apiKey: string, modelId: string): Promise<boolean> {
  try {
    const openai = new OpenAI({ apiKey });
    await openai.models.retrieve(modelId);
    return true;
  } catch {
    return false;
  }
}
