/**
 * Public API exports
 *
 * This is the main entry point for the API client.
 * Import from '@/lib/api' to use the API client in your components.
 */

export { apiClient } from './client';
export type {
  Provider,
  GenerateTextRequest,
  GenerateImageRequest,
  GenerateTextResponse,
  GenerateImageResponse,
  ApiErrorResponse,
} from './types';
export { isApiError } from './types';
