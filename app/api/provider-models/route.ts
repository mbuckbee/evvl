/**
 * Provider Models API
 *
 * GET /api/provider-models
 *
 * Returns cached model lists fetched directly from provider APIs.
 * Uses Next.js data cache with 1-hour revalidation.
 *
 * Query params:
 *   - provider: 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'all' (default: 'all')
 *   - refresh: 'true' to force refresh (requires auth in production)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  discoverOpenAIModels,
  discoverAnthropicModels,
  discoverGeminiModels,
} from '@/lib/discovery';
import { DiscoveredModel } from '@/lib/discovery/types';

// Cache duration: 1 hour
export const revalidate = 3600;

// Provider API keys from environment
function getApiKeys() {
  return {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };
}

// Simplified model structure for the app
export interface ProviderModel {
  id: string;           // The canonical slug to use in API calls
  displayName: string;  // Human-readable name
  provider: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
  type: string;         // 'chat', 'image', 'embedding', etc.
  created?: number;     // Unix timestamp if available
}

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

// Convert discovered models to simplified format
function toProviderModel(model: DiscoveredModel, provider: ProviderModel['provider']): ProviderModel {
  return {
    id: model.id,
    displayName: model.displayName || model.id,
    provider,
    type: model.modelType || 'chat',
    created: model.created,
  };
}

// Fetch OpenRouter models (they have a public API)
async function fetchOpenRouterModels(): Promise<ProviderModel[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];

    return models.map((m: any) => ({
      id: m.id,
      displayName: m.name || m.id,
      provider: 'openrouter' as const,
      type: 'chat',
      created: m.created,
    }));
  } catch (error: any) {
    console.error('[provider-models] OpenRouter fetch failed:', error.message);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const providerFilter = searchParams.get('provider') || 'all';

  const apiKeys = getApiKeys();
  const cachedAt = Date.now();

  const response: ProviderModelsResponse = {
    success: true,
    providers: {
      openai: { available: false, models: [] },
      anthropic: { available: false, models: [] },
      gemini: { available: false, models: [] },
      openrouter: { available: false, models: [] },
    },
    cachedAt,
  };

  // Fetch in parallel based on filter
  const fetchPromises: Promise<void>[] = [];

  // OpenAI
  if (providerFilter === 'all' || providerFilter === 'openai') {
    if (apiKeys.openai) {
      fetchPromises.push(
        discoverOpenAIModels(apiKeys.openai)
          .then(result => {
            if (result.success) {
              response.providers.openai = {
                available: true,
                models: result.models.map(m => toProviderModel(m, 'openai')),
              };
            } else {
              response.providers.openai = {
                available: false,
                models: [],
                error: result.error,
              };
            }
          })
          .catch(err => {
            response.providers.openai = {
              available: false,
              models: [],
              error: err.message,
            };
          })
      );
    } else {
      response.providers.openai.error = 'No API key configured';
    }
  }

  // Anthropic
  if (providerFilter === 'all' || providerFilter === 'anthropic') {
    if (apiKeys.anthropic) {
      fetchPromises.push(
        discoverAnthropicModels(apiKeys.anthropic)
          .then(result => {
            if (result.success) {
              response.providers.anthropic = {
                available: true,
                models: result.models.map(m => toProviderModel(m, 'anthropic')),
              };
            } else {
              response.providers.anthropic = {
                available: false,
                models: [],
                error: result.error,
              };
            }
          })
          .catch(err => {
            response.providers.anthropic = {
              available: false,
              models: [],
              error: err.message,
            };
          })
      );
    } else {
      response.providers.anthropic.error = 'No API key configured';
    }
  }

  // Gemini
  if (providerFilter === 'all' || providerFilter === 'gemini') {
    if (apiKeys.gemini) {
      fetchPromises.push(
        discoverGeminiModels(apiKeys.gemini)
          .then(result => {
            if (result.success) {
              response.providers.gemini = {
                available: true,
                models: result.models.map(m => toProviderModel(m, 'gemini')),
              };
            } else {
              response.providers.gemini = {
                available: false,
                models: [],
                error: result.error,
              };
            }
          })
          .catch(err => {
            response.providers.gemini = {
              available: false,
              models: [],
              error: err.message,
            };
          })
      );
    } else {
      response.providers.gemini.error = 'No API key configured';
    }
  }

  // OpenRouter (no API key needed for model list)
  if (providerFilter === 'all' || providerFilter === 'openrouter') {
    fetchPromises.push(
      fetchOpenRouterModels()
        .then(models => {
          response.providers.openrouter = {
            available: models.length > 0,
            models,
          };
        })
        .catch(err => {
          response.providers.openrouter = {
            available: false,
            models: [],
            error: err.message,
          };
        })
    );
  }

  // Wait for all fetches
  await Promise.all(fetchPromises);

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
