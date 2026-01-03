/**
 * Main API client for Evvl
 *
 * Provides a unified interface for making API calls that automatically
 * routes to the appropriate implementation based on the runtime environment:
 * - Web (browser): Uses proxy API routes (/api/generate)
 * - Tauri (desktop): Makes direct API calls to providers
 */

import { getRuntimeEnvironment } from '../environment';
import * as proxyApi from './proxy';
import {
  GenerateTextRequest,
  GenerateImageRequest,
  GenerateTextResponse,
  GenerateImageResponse,
  ApiErrorResponse,
} from './types';

/**
 * API Client class
 *
 * Singleton that routes requests based on runtime environment.
 */
class ApiClient {
  private environment = getRuntimeEnvironment();

  /**
   * Generate text response from AI model
   *
   * @param request - Text generation parameters
   * @returns Generated text or error
   */
  async generateText(
    request: GenerateTextRequest
  ): Promise<GenerateTextResponse | ApiErrorResponse> {
    // Route to appropriate implementation based on environment
    if (this.environment === 'tauri') {
      // Dynamic import to avoid bundling Node.js dependencies in web build
      const directApi = await import('./direct');
      return directApi.generateText(request);
    } else {
      return proxyApi.generateText(request);
    }
  }

  /**
   * Generate image from AI model
   *
   * @param request - Image generation parameters
   * @returns Generated image URL or error
   */
  async generateImage(
    request: GenerateImageRequest
  ): Promise<GenerateImageResponse | ApiErrorResponse> {
    // Route to appropriate implementation based on environment
    if (this.environment === 'tauri') {
      // Dynamic import to avoid bundling Node.js dependencies in web build
      const directApi = await import('./direct');
      return directApi.generateImage(request);
    } else {
      return proxyApi.generateImage(request);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
