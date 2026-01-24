/**
 * Evvl Configuration
 *
 * This file contains all configuration for AI providers and their available models.
 * Update this file to add new providers or modify available models.
 */

export interface ModelOption {
  value: string;
  label: string;
}

export interface ProviderConfig {
  key: 'openai' | 'anthropic' | 'openrouter' | 'gemini' | 'ollama' | 'lmstudio';
  name: string;
  logo: string;
  models: ModelOption[];
  settingsUrl: string;
  testModel?: string; // Model to use for API key testing
  isLocal?: boolean; // True for local providers (ollama, lmstudio)
  defaultEndpoint?: string; // Default endpoint URL for local providers
}

export const PROVIDERS: ProviderConfig[] = [
  {
    key: 'openai',
    name: 'ChatGPT',
    logo: '/logos/chatgpt.svg',
    settingsUrl: 'https://platform.openai.com/api-keys',
    testModel: 'gpt-3.5-turbo',
    models: [], // Populated dynamically from OpenRouter API
  },
  {
    key: 'anthropic',
    name: 'Claude',
    logo: '/logos/claude.svg',
    settingsUrl: 'https://console.anthropic.com/settings/keys',
    testModel: 'claude-3-haiku-20240307',
    models: [], // Populated dynamically from OpenRouter API
  },
  {
    key: 'openrouter',
    name: 'OpenRouter',
    logo: '/logos/openrouter.svg',
    settingsUrl: 'https://openrouter.ai/keys',
    testModel: 'openai/gpt-3.5-turbo',
    models: [], // Populated dynamically from OpenRouter API
  },
  {
    key: 'gemini',
    name: 'Gemini',
    logo: '/logos/gemini.svg',
    settingsUrl: 'https://aistudio.google.com/app/apikey',
    testModel: 'gemini-2.0-flash-exp', // Use direct API format, not OpenRouter format
    models: [], // Populated dynamically from OpenRouter API
  },
  {
    key: 'ollama',
    name: 'Ollama',
    logo: '/logos/ollama.svg',
    settingsUrl: 'https://ollama.ai/download',
    isLocal: true,
    defaultEndpoint: 'http://localhost:11434',
    models: [], // Populated dynamically from local service
  },
  {
    key: 'lmstudio',
    name: 'LM Studio',
    logo: '/logos/lmstudio.svg',
    settingsUrl: 'https://lmstudio.ai/',
    isLocal: true,
    defaultEndpoint: 'http://localhost:1234',
    models: [], // Populated dynamically from local service
  },
];

export type ProviderKey = 'openai' | 'anthropic' | 'openrouter' | 'gemini' | 'ollama' | 'lmstudio';

/**
 * Get provider configuration by key
 */
export function getProvider(key: ProviderKey): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.key === key);
}

/**
 * Get all provider keys
 */
export function getProviderKeys(): ProviderKey[] {
  return PROVIDERS.map(p => p.key);
}

/**
 * Get models for a specific provider
 */
export function getModelsForProvider(key: ProviderKey): ModelOption[] {
  const provider = getProvider(key);
  return provider?.models || [];
}

/**
 * Get default model for a provider (first in the list)
 * Returns empty string if models haven't loaded yet - handled by page logic
 */
export function getDefaultModel(key: ProviderKey): string {
  const models = getModelsForProvider(key);
  return models[0]?.value || '';
}

/**
 * Get test model for a provider
 */
export function getTestModel(key: ProviderKey): string {
  const provider = getProvider(key);
  return provider?.testModel || getDefaultModel(key);
}

/**
 * Check if a provider is a local provider (no API key required)
 */
export function isLocalProvider(key: ProviderKey): boolean {
  const provider = getProvider(key);
  return provider?.isLocal === true;
}

/**
 * Get the default endpoint for a local provider
 */
export function getDefaultEndpoint(key: ProviderKey): string {
  const provider = getProvider(key);
  return provider?.defaultEndpoint || '';
}
