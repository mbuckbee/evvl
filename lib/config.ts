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
  key: 'openai' | 'anthropic' | 'openrouter';
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
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
  {
    key: 'anthropic',
    name: 'Claude',
    logo: '/logos/claude.svg',
    settingsUrl: 'https://console.anthropic.com/settings/keys',
    testModel: 'claude-3-haiku-20240307',
    models: [
      // Claude 4.5 series (current generation)
      { value: 'claude-sonnet-4-5-20250929', label: '4.5 Sonnet' },
      { value: 'claude-haiku-4-5-20251001', label: '4.5 Haiku' },
      { value: 'claude-opus-4-5-20251101', label: '4.5 Opus' },
      // Claude 4 series
      { value: 'claude-sonnet-4-20250514', label: '4 Sonnet' },
      { value: 'claude-opus-4-20250514', label: '4 Opus' },
      { value: 'claude-opus-4-1-20250805', label: '4.1 Opus' },
      // Claude 3 (still active)
      { value: 'claude-3-haiku-20240307', label: '3 Haiku' },
      // Deprecated (still working until retirement)
      { value: 'claude-3-opus-20240229', label: '3 Opus (deprecated)' },
      { value: 'claude-3-5-haiku-20241022', label: '3.5 Haiku (deprecated)' },
      { value: 'claude-3-7-sonnet-20250219', label: '3.7 Sonnet (deprecated)' },
    ],
  },
  {
    key: 'openrouter',
    name: 'OpenRouter',
    logo: '/logos/openrouter.svg',
    settingsUrl: 'https://openrouter.ai/keys',
    testModel: 'openai/gpt-3.5-turbo',
    models: [
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
      { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
      { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
      { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
      { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
    ],
  },
];

/**
 * Get provider configuration by key
 */
export function getProvider(key: 'openai' | 'anthropic' | 'openrouter'): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.key === key);
}

/**
 * Get all provider keys
 */
export function getProviderKeys(): ('openai' | 'anthropic' | 'openrouter')[] {
  return PROVIDERS.map(p => p.key);
}

/**
 * Get models for a specific provider
 */
export function getModelsForProvider(key: 'openai' | 'anthropic' | 'openrouter'): ModelOption[] {
  const provider = getProvider(key);
  return provider?.models || [];
}

/**
 * Get default model for a provider (first in the list)
 */
export function getDefaultModel(key: 'openai' | 'anthropic' | 'openrouter'): string {
  const models = getModelsForProvider(key);
  return models[0]?.value || '';
}

/**
 * Get test model for a provider
 */
export function getTestModel(key: 'openai' | 'anthropic' | 'openrouter'): string {
  const provider = getProvider(key);
  return provider?.testModel || getDefaultModel(key);
}
