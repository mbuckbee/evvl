/**
 * Validation Test Prompts
 *
 * Standard prompts used for API validation testing
 */

import { Provider } from './types';

/**
 * Standard text generation prompt
 * Short and simple to minimize token usage
 */
export const TEXT_TEST_PROMPT = "Say 'Hello, I am working correctly!' in one sentence.";

/**
 * Image generation prompts per provider
 * Simple prompts to verify image generation capability
 */
export const IMAGE_TEST_PROMPTS: Record<Provider, string> = {
  openai: 'A simple red apple on a white background',
  gemini: 'A simple red apple on a white background',
  anthropic: '', // Anthropic doesn't support image generation
  openrouter: '', // OpenRouter doesn't support direct image generation
};

/**
 * Get the appropriate test prompt for a model
 */
export function getTestPrompt(provider: Provider, isImage: boolean): string {
  if (isImage) {
    return IMAGE_TEST_PROMPTS[provider] || '';
  }
  return TEXT_TEST_PROMPT;
}
