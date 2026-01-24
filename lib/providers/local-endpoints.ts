/**
 * Local provider endpoint management
 *
 * Stores and retrieves custom endpoints for local AI providers
 * (Ollama, LM Studio) in localStorage.
 */

const STORAGE_KEY = 'evvl_local_endpoints';

interface LocalEndpoints {
  ollama?: string;
  lmstudio?: string;
}

/**
 * Get all stored local endpoints
 */
export function getLocalEndpoints(): LocalEndpoints {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load local endpoints:', e);
  }

  return {};
}

/**
 * Get a specific local endpoint
 */
export function getLocalEndpoint(provider: 'ollama' | 'lmstudio'): string | undefined {
  const endpoints = getLocalEndpoints();
  return endpoints[provider];
}

/**
 * Save a local endpoint
 */
export function saveLocalEndpoint(provider: 'ollama' | 'lmstudio', endpoint: string): void {
  if (typeof window === 'undefined') return;

  try {
    const endpoints = getLocalEndpoints();
    endpoints[provider] = endpoint;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints));
  } catch (e) {
    console.error('Failed to save local endpoint:', e);
  }
}

/**
 * Remove a local endpoint (revert to default)
 */
export function removeLocalEndpoint(provider: 'ollama' | 'lmstudio'): void {
  if (typeof window === 'undefined') return;

  try {
    const endpoints = getLocalEndpoints();
    delete endpoints[provider];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints));
  } catch (e) {
    console.error('Failed to remove local endpoint:', e);
  }
}

/**
 * Clear all local endpoints
 */
export function clearLocalEndpoints(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear local endpoints:', e);
  }
}
