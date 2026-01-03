/**
 * Stub for direct API implementation
 *
 * This file is used in place of direct.ts for client-side bundles
 * to prevent webpack from trying to bundle Node.js dependencies.
 * The real direct.ts is only used in Tauri/server environments.
 */

import {
  GenerateTextRequest,
  GenerateImageRequest,
  GenerateTextResponse,
  GenerateImageResponse,
  ApiErrorResponse,
} from './types';

export async function generateText(
  request: GenerateTextRequest
): Promise<GenerateTextResponse | ApiErrorResponse> {
  return { error: 'Direct API calls are not supported in this environment' };
}

export async function generateImage(
  request: GenerateImageRequest
): Promise<GenerateImageResponse | ApiErrorResponse> {
  return { error: 'Direct API calls are not supported in this environment' };
}
