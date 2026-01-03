/**
 * Proxy API implementation
 *
 * Routes API calls through Next.js API routes (/api/generate and /api/generate-image)
 * This is the existing behavior used by the web app deployed on Vercel.
 */

import {
  GenerateTextRequest,
  GenerateImageRequest,
  GenerateTextResponse,
  GenerateImageResponse,
  ApiErrorResponse,
} from './types';

/**
 * Generate text via proxy API route
 */
export async function generateText(
  request: GenerateTextRequest
): Promise<GenerateTextResponse | ApiErrorResponse> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: request.prompt,
      provider: request.provider,
      model: request.model,
      apiKey: request.apiKey,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { error: data.error || 'Failed to generate response' };
  }

  return data as GenerateTextResponse;
}

/**
 * Generate image via proxy API route
 */
export async function generateImage(
  request: GenerateImageRequest
): Promise<GenerateImageResponse | ApiErrorResponse> {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: request.prompt,
      provider: request.provider,
      model: request.model,
      apiKey: request.apiKey,
      size: request.size,
      quality: request.quality,
      style: request.style,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { error: data.error || 'Failed to generate image' };
  }

  return data as GenerateImageResponse;
}
