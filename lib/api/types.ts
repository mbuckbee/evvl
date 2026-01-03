/**
 * Shared TypeScript interfaces for API client
 *
 * These types define the contract between the UI and the API layer,
 * working identically for both web (proxy) and desktop (direct) implementations.
 */

export type Provider = 'openai' | 'anthropic' | 'openrouter' | 'gemini';

/**
 * Base request parameters shared by all API calls
 */
export interface BaseRequest {
  prompt: string;
  provider: Provider;
  model: string;
  apiKey: string;
}

/**
 * Request for text generation
 */
export interface GenerateTextRequest extends BaseRequest {
  // No additional fields for text generation
}

/**
 * Request for image generation
 */
export interface GenerateImageRequest extends BaseRequest {
  // DALL-E specific parameters (optional)
  size?: string; // e.g., '1024x1024', '512x512'
  quality?: 'standard' | 'hd'; // DALL-E 3 only
  style?: 'vivid' | 'natural'; // DALL-E 3 only
}

/**
 * Successful text generation response
 */
export interface GenerateTextResponse {
  content: string;
  tokens: number;
  latency: number;
}

/**
 * Successful image generation response
 */
export interface GenerateImageResponse {
  imageUrl: string;
  revisedPrompt: string;
  latency: number;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  error: string;
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(
  response: GenerateTextResponse | GenerateImageResponse | ApiErrorResponse
): response is ApiErrorResponse {
  return 'error' in response;
}
