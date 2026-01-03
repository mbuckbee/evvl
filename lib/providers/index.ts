/**
 * Provider exports
 *
 * Central export point for all AI provider implementations.
 * Each provider module handles both text and image generation (where applicable).
 */

import * as openai from './openai';
import * as anthropic from './anthropic';
import * as openrouter from './openrouter';
import * as gemini from './gemini';

export { openai, anthropic, openrouter, gemini };

// Re-export error types
export { ModelNotAvailableError } from './anthropic';

// Type exports for convenience
export type {
  OpenAITextRequest,
  OpenAITextResponse,
  OpenAIImageRequest,
  OpenAIImageResponse,
} from './openai';

export type {
  AnthropicTextRequest,
  AnthropicTextResponse,
} from './anthropic';

export type {
  OpenRouterTextRequest,
  OpenRouterTextResponse,
} from './openrouter';

export type {
  GeminiTextRequest,
  GeminiTextResponse,
  GeminiImageRequest,
  GeminiImageResponse,
} from './gemini';
