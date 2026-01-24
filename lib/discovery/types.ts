/**
 * Discovery Types
 *
 * Simple types for fetching model lists from provider APIs.
 */

import { Provider } from '@/lib/validation/types';

/**
 * Model discovered from a provider's API
 */
export interface DiscoveredModel {
  /** Model ID from provider API (canonical slug) */
  id: string;

  /** Provider */
  provider: Provider;

  /** Display name if available */
  displayName?: string;

  /** Created timestamp if available */
  created?: number;

  /** Model type (chat, image, embedding, etc.) */
  modelType?: string;

  /** Owner/developer */
  ownedBy?: string;
}

/**
 * Result from running discovery for a single provider
 */
export interface ProviderDiscoveryResult {
  provider: Provider;
  success: boolean;
  models: DiscoveredModel[];
  error?: string;
  discoveredAt: number;
}

/**
 * API keys needed for discovery
 */
export interface DiscoveryApiKeys {
  openai?: string;
  anthropic?: string;
  gemini?: string;
}

/**
 * Combined discovery results from all providers
 */
export interface DiscoveryResults {
  results: ProviderDiscoveryResult[];
  totalModels: number;
  errors: string[];
  timestamp: number;
}
