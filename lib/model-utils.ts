/**
 * Model Utility Functions
 *
 * Centralized logic for model identification and categorization
 */

import { Provider } from './types';

/**
 * Determine if a model supports image generation
 *
 * @param provider - The provider (openai, anthropic, openrouter, gemini)
 * @param modelId - The model ID (can include provider prefix like "openai/dall-e-3" or just "dall-e-3")
 * @returns true if the model generates images, false if it generates text
 */
export function isImageModel(provider: Provider, modelId: string): boolean {
  const lowerModelId = modelId.toLowerCase();

  // OpenAI image models
  if (provider === 'openai') {
    return lowerModelId.includes('dall-e') ||
           (lowerModelId.includes('gpt-') && lowerModelId.includes('-image'));
  }

  // Google Gemini image models
  if (provider === 'gemini') {
    return lowerModelId.includes('imagen') ||
           lowerModelId.includes('image-preview') ||
           lowerModelId.includes('image-generation');
  }

  // OpenRouter can host various image models
  if (provider === 'openrouter') {
    return lowerModelId.includes('dall-e') ||
           (lowerModelId.includes('gpt-') && lowerModelId.includes('-image')) ||
           lowerModelId.includes('stable-diffusion') ||
           lowerModelId.includes('midjourney') ||
           lowerModelId.includes('imagen');
  }

  // Anthropic doesn't support image generation (as of Jan 2025)
  return false;
}
