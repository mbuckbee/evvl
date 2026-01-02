/**
 * Type extensions for @google/generative-ai
 *
 * These extend the official types to include properties that are documented
 * in the API but not yet included in the TypeScript definitions.
 */

import '@google/generative-ai';

declare module '@google/generative-ai' {
  /**
   * Extended GenerationConfig to include image generation properties
   * that are documented but not in the official types yet.
   *
   * See: https://ai.google.dev/gemini-api/docs/image-generation
   */
  interface GenerationConfig {
    /**
     * Specifies the modalities that the model should return in its response.
     * Required for image generation. Must include both 'TEXT' and 'IMAGE'.
     *
     * @example
     * responseModalities: ['TEXT', 'IMAGE']
     */
    responseModalities?: string[];
  }
}
