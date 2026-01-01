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
  key: 'openai' | 'anthropic' | 'openrouter' | 'gemini';
  name: string;
  logo: string;
  models: ModelOption[];
  settingsUrl: string;
  testModel?: string; // Model to use for API key testing
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
    testModel: 'gemini-1.5-flash',
    models: [], // Populated dynamically
  },
];

/**
 * Get provider configuration by key
 */
export function getProvider(key: 'openai' | 'anthropic' | 'openrouter' | 'gemini'): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.key === key);
}

/**
 * Get all provider keys
 */
export function getProviderKeys(): ('openai' | 'anthropic' | 'openrouter' | 'gemini')[] {
  return PROVIDERS.map(p => p.key);
}

/**
 * Get models for a specific provider
 */
export function getModelsForProvider(key: 'openai' | 'anthropic' | 'openrouter' | 'gemini'): ModelOption[] {
  const provider = getProvider(key);
  return provider?.models || [];
}

/**
 * Get default model for a provider (first in the list)
 * Returns empty string if models haven't loaded yet - handled by page logic
 */
export function getDefaultModel(key: 'openai' | 'anthropic' | 'openrouter' | 'gemini'): string {
  const models = getModelsForProvider(key);
  return models[0]?.value || '';
}

/**
 * Get test model for a provider
 */
export function getTestModel(key: 'openai' | 'anthropic' | 'openrouter' | 'gemini'): string {
  const provider = getProvider(key);
  return provider?.testModel || getDefaultModel(key);
}
