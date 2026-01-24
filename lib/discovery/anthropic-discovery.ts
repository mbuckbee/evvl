/**
 * Anthropic Model Discovery
 *
 * Uses Anthropic's GET /v1/models endpoint to get authoritative model IDs.
 * Returns canonical IDs with date suffixes like "claude-sonnet-4-20250514"
 *
 * API Reference: https://platform.claude.com/docs/en/api/models-list
 */

import { DiscoveredModel, ProviderDiscoveryResult } from './types';

/**
 * Response structure from Anthropic's /v1/models endpoint
 */
interface AnthropicModelsResponse {
  data: AnthropicModelInfo[];
  has_more: boolean;
  first_id: string | null;
  last_id: string | null;
}

interface AnthropicModelInfo {
  id: string;
  type: string;
  display_name: string;
  created_at: string; // ISO timestamp
}

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';

/**
 * Patterns to exclude from discovery
 */
const EXCLUDE_PATTERNS = [
  /^claude-2/,         // Retired Claude 2.x models
  /^claude-instant/,   // Retired instant models
];

/**
 * Discover models from Anthropic's API
 *
 * Uses the new /v1/models endpoint which provides:
 * - Authoritative model IDs with date suffixes
 * - Display names for UI
 * - Created timestamps
 *
 * @param apiKey - Anthropic API key
 * @returns Discovery result with list of models
 */
export async function discoverAnthropicModels(apiKey: string): Promise<ProviderDiscoveryResult> {
  const startTime = Date.now();

  try {
    const allModels: AnthropicModelInfo[] = [];
    let hasMore = true;
    let afterId: string | null = null;

    // Paginate through all models
    while (hasMore) {
      const url = new URL(`${ANTHROPIC_API_BASE}/models`);
      url.searchParams.set('limit', '100');
      if (afterId) {
        url.searchParams.set('after_id', afterId);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data: AnthropicModelsResponse = await response.json();
      allModels.push(...data.data);

      hasMore = data.has_more;
      afterId = data.last_id;
    }

    // Filter and transform models
    const discoveredModels: DiscoveredModel[] = allModels
      .filter(model => {
        // Check if model should be excluded
        return !EXCLUDE_PATTERNS.some(pattern => pattern.test(model.id));
      })
      .map(model => ({
        id: model.id,
        provider: 'anthropic' as const,
        displayName: model.display_name,
        created: new Date(model.created_at).getTime(),
        modelType: 'chat-completion', // Anthropic only offers chat models
        ownedBy: 'Anthropic',
      }));

    // Sort by ID (newer models have later dates)
    discoveredModels.sort((a, b) => b.id.localeCompare(a.id));

    console.log(`[Anthropic Discovery] Found ${discoveredModels.length} models`);

    return {
      provider: 'anthropic',
      success: true,
      models: discoveredModels,
      discoveredAt: startTime,
    };
  } catch (error: any) {
    console.error('[Anthropic Discovery] Error:', error.message);

    return {
      provider: 'anthropic',
      success: false,
      models: [],
      error: error.message || 'Failed to discover Anthropic models',
      discoveredAt: startTime,
    };
  }
}

/**
 * Verify an Anthropic model exists by attempting a minimal API call
 *
 * @param apiKey - Anthropic API key
 * @param modelId - Model ID to check
 * @returns true if model exists, false otherwise
 */
export async function verifyAnthropicModel(apiKey: string, modelId: string): Promise<boolean> {
  try {
    const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    // A 200 or 400 (validation error) means the model exists
    // A 404 means the model doesn't exist
    return response.status !== 404;
  } catch {
    return false;
  }
}

/**
 * Extract the base model name without date suffix
 * e.g., "claude-sonnet-4-20250514" -> "claude-sonnet-4"
 */
export function extractBaseModelName(modelId: string): string {
  // Match date suffix pattern: -YYYYMMDD
  const match = modelId.match(/^(.+)-(\d{8})$/);
  return match ? match[1] : modelId;
}

/**
 * Extract date suffix from model ID
 * e.g., "claude-sonnet-4-20250514" -> "20250514"
 */
export function extractDateSuffix(modelId: string): string | null {
  const match = modelId.match(/-(\d{8})$/);
  return match ? match[1] : null;
}
