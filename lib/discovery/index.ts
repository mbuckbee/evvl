/**
 * Unified Model Discovery Service
 *
 * Fetches model lists directly from provider APIs.
 */

import {
  DiscoveryApiKeys,
  DiscoveryResults,
  ProviderDiscoveryResult,
} from './types';
import { Provider } from '@/lib/validation/types';
import { discoverOpenAIModels, verifyOpenAIModel } from './openai-discovery';
import { discoverAnthropicModels, verifyAnthropicModel } from './anthropic-discovery';
import { discoverGeminiModels, verifyGeminiModel } from './gemini-discovery';

export {
  discoverOpenAIModels,
  discoverAnthropicModels,
  discoverGeminiModels,
  verifyOpenAIModel,
  verifyAnthropicModel,
  verifyGeminiModel,
};

export * from './types';

/**
 * Discover models from all providers with API keys
 *
 * Runs discovery in parallel for maximum efficiency.
 *
 * @param apiKeys - API keys for each provider
 * @returns Combined discovery results
 */
export async function discoverAllModels(
  apiKeys: DiscoveryApiKeys
): Promise<DiscoveryResults> {
  const startTime = Date.now();
  const promises: Promise<ProviderDiscoveryResult>[] = [];
  const providers: Provider[] = [];

  // Queue up discovery for each provider with an API key
  if (apiKeys.openai) {
    promises.push(discoverOpenAIModels(apiKeys.openai));
    providers.push('openai');
  }

  if (apiKeys.anthropic) {
    promises.push(discoverAnthropicModels(apiKeys.anthropic));
    providers.push('anthropic');
  }

  if (apiKeys.gemini) {
    promises.push(discoverGeminiModels(apiKeys.gemini));
    providers.push('gemini');
  }

  // Run all discoveries in parallel
  const results = await Promise.all(promises);

  // Collect errors
  const errors: string[] = [];
  let totalModels = 0;

  for (const result of results) {
    if (result.success) {
      totalModels += result.models.length;
    } else if (result.error) {
      errors.push(`${result.provider}: ${result.error}`);
    }
  }

  console.log(`[Discovery] Completed in ${Date.now() - startTime}ms`);
  console.log(`[Discovery] Found ${totalModels} models from ${providers.length} providers`);
  if (errors.length > 0) {
    console.log(`[Discovery] Errors: ${errors.join(', ')}`);
  }

  return {
    results,
    totalModels,
    errors,
    timestamp: startTime,
  };
}

/**
 * Discover models from a single provider
 *
 * @param provider - The provider to discover from
 * @param apiKey - The API key for that provider
 * @returns Discovery result for that provider
 */
export async function discoverProviderModels(
  provider: Provider,
  apiKey: string
): Promise<ProviderDiscoveryResult> {
  switch (provider) {
    case 'openai':
      return discoverOpenAIModels(apiKey);
    case 'anthropic':
      return discoverAnthropicModels(apiKey);
    case 'gemini':
      return discoverGeminiModels(apiKey);
    default:
      return {
        provider,
        success: false,
        models: [],
        error: `Discovery not supported for provider: ${provider}`,
        discoveredAt: Date.now(),
      };
  }
}

/**
 * Verify a model exists for a provider
 *
 * @param provider - The provider
 * @param modelId - The model ID to verify
 * @param apiKey - The API key for that provider
 * @returns true if model exists
 */
export async function verifyModel(
  provider: Provider,
  modelId: string,
  apiKey: string
): Promise<boolean> {
  switch (provider) {
    case 'openai':
      return verifyOpenAIModel(apiKey, modelId);
    case 'anthropic':
      return verifyAnthropicModel(apiKey, modelId);
    case 'gemini':
      return verifyGeminiModel(apiKey, modelId);
    default:
      return false;
  }
}

/**
 * Get providers that support model discovery
 */
export function getDiscoverableProviders(): Provider[] {
  return ['openai', 'anthropic', 'gemini'];
}

/**
 * Check which providers have valid API keys for discovery
 */
export function getProvidersWithKeys(apiKeys: DiscoveryApiKeys): Provider[] {
  const providers: Provider[] = [];

  if (apiKeys.openai) providers.push('openai');
  if (apiKeys.anthropic) providers.push('anthropic');
  if (apiKeys.gemini) providers.push('gemini');

  return providers;
}
