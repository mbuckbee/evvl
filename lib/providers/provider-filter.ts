/**
 * Provider filtering utilities
 *
 * Filters available providers based on the runtime environment.
 * Local providers (Ollama, LM Studio) are only available in Tauri desktop app.
 */

import { isTauriEnvironment } from '@/lib/environment';
import { PROVIDERS, ProviderConfig, ProviderKey } from '@/lib/config';

/**
 * Get providers available in the current environment
 *
 * - In Tauri desktop app: All providers including local ones
 * - In web browser: Only cloud providers (no local)
 */
export function getAvailableProviders(): ProviderConfig[] {
  const isTauri = isTauriEnvironment();

  if (isTauri) {
    // Desktop app: all providers available
    return PROVIDERS;
  }

  // Web: filter out local providers
  return PROVIDERS.filter(p => !p.isLocal);
}

/**
 * Get available provider keys for the current environment
 */
export function getAvailableProviderKeys(): ProviderKey[] {
  return getAvailableProviders().map(p => p.key);
}

/**
 * Check if a provider is available in the current environment
 */
export function isProviderAvailable(key: ProviderKey): boolean {
  return getAvailableProviderKeys().includes(key);
}

/**
 * Check if local providers are available (desktop only)
 */
export function areLocalProvidersAvailable(): boolean {
  return isTauriEnvironment();
}
