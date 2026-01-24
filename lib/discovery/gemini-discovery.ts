/**
 * Gemini Model Discovery
 *
 * Uses Google's REST API to get authoritative Gemini model IDs.
 * Returns model names like "gemini-2.0-flash-exp", "gemini-1.5-pro"
 *
 * API Reference: https://ai.google.dev/api/models
 */

import { DiscoveredModel, ProviderDiscoveryResult } from './types';

/**
 * Response structure from Gemini's /v1beta/models endpoint
 */
interface GeminiModelsResponse {
  models: GeminiModelInfo[];
  nextPageToken?: string;
}

interface GeminiModelInfo {
  name: string; // Format: "models/gemini-1.5-pro"
  displayName: string;
  description: string;
  version: string;
  supportedGenerationMethods: string[];
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Prefixes to include in discovery
 */
const INCLUDE_PREFIXES = [
  'gemini-',
  'imagen-',
];

/**
 * Patterns to exclude from discovery entirely (not shown anywhere)
 */
const EXCLUDE_PATTERNS = [
  /gemma/i,           // Gemma is open-source, not part of Gemini API
  /^text-/,           // Legacy text models
  /^embedding-/,      // Embedding models (use text-embedding prefix)
  /^aqa/i,            // AQA models
];

/**
 * Determine model type from model name and supported generation methods
 */
function inferModelType(model: GeminiModelInfo): string {
  const methods = model.supportedGenerationMethods || [];
  const modelId = extractModelId(model.name).toLowerCase();

  // Check by model name first (more reliable for some models)
  if (modelId.startsWith('imagen-')) {
    return 'image';
  }
  if (modelId.includes('embedding')) {
    return 'embedding';
  }
  if (modelId.includes('tts') || modelId.includes('native-audio')) {
    return 'audio';
  }

  // Then check by supported methods
  if (methods.includes('generateImage')) {
    return 'image';
  }
  if (methods.includes('embedContent')) {
    return 'embedding';
  }
  if (methods.includes('generateContent')) {
    return 'chat';
  }

  return 'unknown';
}

/**
 * Extract model ID from the full name
 * e.g., "models/gemini-1.5-pro" -> "gemini-1.5-pro"
 */
function extractModelId(fullName: string): string {
  return fullName.replace(/^models\//, '');
}

/**
 * Discover models from Google's Gemini API
 *
 * @param apiKey - Gemini API key
 * @returns Discovery result with list of models
 */
export async function discoverGeminiModels(apiKey: string): Promise<ProviderDiscoveryResult> {
  const startTime = Date.now();

  try {
    const allModels: GeminiModelInfo[] = [];
    let pageToken: string | undefined;

    // Paginate through all models
    do {
      const url = new URL(`${GEMINI_API_BASE}/models`);
      url.searchParams.set('key', apiKey);
      url.searchParams.set('pageSize', '100');
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiModelsResponse = await response.json();
      allModels.push(...(data.models || []));
      pageToken = data.nextPageToken;
    } while (pageToken);

    // Filter and transform models
    const discoveredModels: DiscoveredModel[] = allModels
      .map(model => ({
        rawName: model.name,
        id: extractModelId(model.name),
        model,
      }))
      .filter(({ id }) => {
        // Check if model should be included
        const shouldInclude = INCLUDE_PREFIXES.some(prefix =>
          id.toLowerCase().startsWith(prefix)
        );

        if (!shouldInclude) {
          return false;
        }

        // Check if model should be excluded
        return !EXCLUDE_PATTERNS.some(pattern => pattern.test(id));
      })
      .map(({ id, model }) => ({
        id,
        provider: 'gemini' as const,
        displayName: model.displayName,
        modelType: inferModelType(model),
        ownedBy: 'Google',
      }));

    // Sort by ID (newer models tend to have higher version numbers)
    discoveredModels.sort((a, b) => b.id.localeCompare(a.id));

    console.log(`[Gemini Discovery] Found ${discoveredModels.length} models`);

    return {
      provider: 'gemini',
      success: true,
      models: discoveredModels,
      discoveredAt: startTime,
    };
  } catch (error: any) {
    console.error('[Gemini Discovery] Error:', error.message);

    return {
      provider: 'gemini',
      success: false,
      models: [],
      error: error.message || 'Failed to discover Gemini models',
      discoveredAt: startTime,
    };
  }
}

/**
 * Verify a Gemini model exists by fetching its metadata
 *
 * @param apiKey - Gemini API key
 * @param modelId - Model ID to check (without "models/" prefix)
 * @returns true if model exists, false otherwise
 */
export async function verifyGeminiModel(apiKey: string, modelId: string): Promise<boolean> {
  try {
    const url = new URL(`${GEMINI_API_BASE}/models/${modelId}`);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
