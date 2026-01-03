/**
 * Direct API implementation
 *
 * Makes direct API calls to AI providers from the client.
 * Used in Tauri desktop app where API keys never leave the user's machine.
 * Uses fetch-based providers for browser compatibility.
 */

import { transformModelSlug } from '@/lib/model-transformer';
import { toApiError } from './errors';
import {
  GenerateTextRequest,
  GenerateImageRequest,
  GenerateTextResponse,
  GenerateImageResponse,
  ApiErrorResponse,
} from './types';

/**
 * Generate text via direct provider API call
 */
export async function generateText(
  request: GenerateTextRequest
): Promise<GenerateTextResponse | ApiErrorResponse> {
  try {
    // Transform model slug if needed
    const transformedModel = transformModelSlug(request.provider, request.model);

    let result;

    // Call the appropriate provider using fetch-based implementations
    // These are browser-compatible and work in Tauri webview
    if (request.provider === 'openai') {
      const openai = await import('@/lib/providers/openai-fetch');
      result = await openai.generateText({
        model: transformedModel,
        prompt: request.prompt,
        apiKey: request.apiKey,
      });
    } else if (request.provider === 'openrouter') {
      const openrouter = await import('@/lib/providers/openrouter-fetch');
      result = await openrouter.generateText({
        model: transformedModel,
        prompt: request.prompt,
        apiKey: request.apiKey,
      });
    } else if (request.provider === 'anthropic') {
      const anthropic = await import('@/lib/providers/anthropic-fetch');
      result = await anthropic.generateText({
        model: transformedModel,
        prompt: request.prompt,
        apiKey: request.apiKey,
      });
    } else if (request.provider === 'gemini') {
      const gemini = await import('@/lib/providers/gemini-fetch');
      result = await gemini.generateText({
        model: transformedModel,
        prompt: request.prompt,
        apiKey: request.apiKey,
      });
    } else {
      return { error: `Unsupported provider: ${request.provider}` };
    }

    return result;
  } catch (error: any) {
    // Handle ModelNotAvailableError from Anthropic provider
    if (error.name === 'ModelNotAvailableError') {
      return { error: error.message };
    }

    // Convert other errors to ApiErrorResponse
    return toApiError(error, 'Failed to generate text');
  }
}

/**
 * Generate image via direct provider API call
 */
export async function generateImage(
  request: GenerateImageRequest
): Promise<GenerateImageResponse | ApiErrorResponse> {
  try {
    // Transform model slug if needed
    const transformedModel = transformModelSlug(request.provider, request.model);

    let result;

    // Call the appropriate provider using fetch-based implementations
    // These are browser-compatible and work in Tauri webview
    if (request.provider === 'openai') {
      const openai = await import('@/lib/providers/openai-fetch');
      result = await openai.generateImage({
        model: request.model, // Don't transform for OpenAI image models
        prompt: request.prompt,
        apiKey: request.apiKey,
        size: request.size,
        quality: request.quality,
        style: request.style,
      });
    } else if (request.provider === 'gemini') {
      const gemini = await import('@/lib/providers/gemini-fetch');
      result = await gemini.generateImage({
        model: transformedModel,
        prompt: request.prompt,
        apiKey: request.apiKey,
      });
    } else {
      return { error: `Unsupported provider for image generation: ${request.provider}` };
    }

    return result;
  } catch (error: any) {
    // Convert errors to ApiErrorResponse
    return toApiError(error, 'Failed to generate image');
  }
}
