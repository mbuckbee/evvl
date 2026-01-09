/**
 * Tests for Model Utility Functions
 */

import { isImageModel } from '../model-utils';

describe('Model Utilities', () => {
  describe('isImageModel', () => {
    describe('OpenAI provider', () => {
      it('should identify DALL-E 3 as an image model', () => {
        expect(isImageModel('openai', 'dall-e-3')).toBe(true);
      });

      it('should identify DALL-E 2 as an image model', () => {
        expect(isImageModel('openai', 'dall-e-2')).toBe(true);
      });

      it('should identify GPT-5 Image models as image models', () => {
        expect(isImageModel('openai', 'gpt-5-image')).toBe(true);
        expect(isImageModel('openai', 'gpt-5-image-mini')).toBe(true);
        expect(isImageModel('openai', 'openai/gpt-5-image')).toBe(true);
        expect(isImageModel('openai', 'openai/gpt-5-image-mini')).toBe(true);
      });

      it('should handle uppercase DALL-E model names', () => {
        expect(isImageModel('openai', 'DALL-E-3')).toBe(true);
        expect(isImageModel('openai', 'DALL-E-2')).toBe(true);
      });

      it('should identify GPT models as text models', () => {
        expect(isImageModel('openai', 'gpt-4')).toBe(false);
        expect(isImageModel('openai', 'gpt-3.5-turbo')).toBe(false);
        expect(isImageModel('openai', 'gpt-4-turbo')).toBe(false);
        expect(isImageModel('openai', 'gpt-4o')).toBe(false);
      });

      it('should NOT identify vision models (which accept images) as image generation models', () => {
        expect(isImageModel('openai', 'gpt-4-vision')).toBe(false);
        expect(isImageModel('openai', 'gpt-4-turbo-vision')).toBe(false);
        expect(isImageModel('openai', 'gpt-4o-vision')).toBe(false);
      });

      it('should handle OpenRouter-style OpenAI model IDs', () => {
        expect(isImageModel('openai', 'openai/dall-e-3')).toBe(true);
        expect(isImageModel('openai', 'openai/gpt-4')).toBe(false);
      });
    });

    describe('Gemini provider', () => {
      it('should identify imagen models as image models', () => {
        expect(isImageModel('gemini', 'imagen-3')).toBe(true);
        expect(isImageModel('gemini', 'google/imagen-2.0')).toBe(true);
      });

      it('should identify image-preview models as image models', () => {
        expect(isImageModel('gemini', 'gemini-2.0-flash-exp-image-preview')).toBe(true);
        expect(isImageModel('gemini', 'google/gemini-image-preview')).toBe(true);
      });

      it('should identify image-generation models as image models', () => {
        expect(isImageModel('gemini', 'gemini-image-generation')).toBe(true);
      });

      it('should handle uppercase Gemini model names', () => {
        expect(isImageModel('gemini', 'IMAGEN-3')).toBe(true);
        expect(isImageModel('gemini', 'GEMINI-IMAGE-PREVIEW')).toBe(true);
      });

      it('should identify Gemini text models as text models', () => {
        expect(isImageModel('gemini', 'gemini-pro')).toBe(false);
        expect(isImageModel('gemini', 'gemini-2.0-flash-exp')).toBe(false);
        expect(isImageModel('gemini', 'gemini-1.5-pro')).toBe(false);
      });
    });

    describe('OpenRouter provider', () => {
      it('should identify DALL-E models as image models', () => {
        expect(isImageModel('openrouter', 'openai/dall-e-3')).toBe(true);
        expect(isImageModel('openrouter', 'openai/dall-e-2')).toBe(true);
      });

      it('should identify GPT Image models as image models', () => {
        expect(isImageModel('openrouter', 'openai/gpt-5-image')).toBe(true);
        expect(isImageModel('openrouter', 'openai/gpt-5-image-mini')).toBe(true);
      });

      it('should identify Stable Diffusion models as image models', () => {
        expect(isImageModel('openrouter', 'stabilityai/stable-diffusion-xl-base-1.0')).toBe(true);
        expect(isImageModel('openrouter', 'stable-diffusion-3-medium')).toBe(true);
      });

      it('should identify Midjourney models as image models', () => {
        expect(isImageModel('openrouter', 'midjourney/v6')).toBe(true);
        expect(isImageModel('openrouter', 'midjourney-turbo')).toBe(true);
      });

      it('should identify Imagen models as image models', () => {
        expect(isImageModel('openrouter', 'google/imagen-3')).toBe(true);
      });

      it('should handle uppercase OpenRouter model names', () => {
        expect(isImageModel('openrouter', 'OPENAI/DALL-E-3')).toBe(true);
        expect(isImageModel('openrouter', 'STABLE-DIFFUSION-XL')).toBe(true);
        expect(isImageModel('openrouter', 'MIDJOURNEY/V6')).toBe(true);
      });

      it('should identify text models as text models', () => {
        expect(isImageModel('openrouter', 'openai/gpt-4')).toBe(false);
        expect(isImageModel('openrouter', 'anthropic/claude-3-opus')).toBe(false);
        expect(isImageModel('openrouter', 'meta-llama/llama-3-8b')).toBe(false);
        expect(isImageModel('openrouter', 'google/gemini-pro')).toBe(false);
      });
    });

    describe('Anthropic provider', () => {
      it('should always return false for Anthropic models', () => {
        expect(isImageModel('anthropic', 'claude-3-opus-20240229')).toBe(false);
        expect(isImageModel('anthropic', 'claude-3-sonnet-20240229')).toBe(false);
        expect(isImageModel('anthropic', 'claude-3-haiku-20240307')).toBe(false);
        expect(isImageModel('anthropic', 'claude-2.1')).toBe(false);
      });

      it('should return false even with image-related keywords in model name', () => {
        // Edge case: if Anthropic ever adds image models, this test would fail
        expect(isImageModel('anthropic', 'claude-image-gen')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty model strings', () => {
        expect(isImageModel('openai', '')).toBe(false);
        expect(isImageModel('gemini', '')).toBe(false);
        expect(isImageModel('openrouter', '')).toBe(false);
        expect(isImageModel('anthropic', '')).toBe(false);
      });

      it('should handle mixed case model IDs', () => {
        expect(isImageModel('openai', 'DaLl-E-3')).toBe(true);
        expect(isImageModel('gemini', 'ImAgEn-2')).toBe(true);
        expect(isImageModel('openrouter', 'StAbLe-DiFfUsIoN-xl')).toBe(true);
      });

      it('should handle model IDs with special characters', () => {
        expect(isImageModel('openai', 'dall-e-3-hd')).toBe(true);
        expect(isImageModel('gemini', 'gemini-2.0-flash-exp-image-preview')).toBe(true);
        expect(isImageModel('openrouter', 'stabilityai/stable-diffusion-xl-base-1.0')).toBe(true);
      });

      it('should not match partial keywords', () => {
        // "doll" contains "dall" but should not match
        expect(isImageModel('openai', 'gpt-4-doll')).toBe(false);
        // "imagine" contains "image" but should not match without full "imagen"
        expect(isImageModel('gemini', 'gemini-imagine-pro')).toBe(false);
      });

      it('should match keywords anywhere in the model ID', () => {
        expect(isImageModel('openai', 'openai/dall-e-3/latest')).toBe(true);
        expect(isImageModel('gemini', 'google/gemini-pro-image-preview/v1')).toBe(true);
        expect(isImageModel('openrouter', 'providers/stable-diffusion/xl/v2')).toBe(true);
      });
    });

    describe('Consistency across providers', () => {
      it('should consistently identify same models across different provider prefixes', () => {
        // DALL-E should be detected regardless of prefix
        expect(isImageModel('openai', 'dall-e-3')).toBe(true);
        expect(isImageModel('openai', 'openai/dall-e-3')).toBe(true);
        expect(isImageModel('openrouter', 'openai/dall-e-3')).toBe(true);
      });

      it('should consistently identify text models', () => {
        expect(isImageModel('openai', 'gpt-4')).toBe(false);
        expect(isImageModel('anthropic', 'claude-3-opus')).toBe(false);
        expect(isImageModel('openrouter', 'openai/gpt-4')).toBe(false);
        expect(isImageModel('openrouter', 'anthropic/claude-3-opus')).toBe(false);
      });
    });

    describe('Real-world model IDs', () => {
      // Test with actual model IDs that appear in the application
      it('should correctly identify actual OpenAI models', () => {
        // Text models
        expect(isImageModel('openai', 'gpt-4-turbo-preview')).toBe(false);
        expect(isImageModel('openai', 'gpt-4-0125-preview')).toBe(false);
        expect(isImageModel('openai', 'gpt-3.5-turbo-0125')).toBe(false);
        expect(isImageModel('openai', 'gpt-5')).toBe(false);
        expect(isImageModel('openai', 'gpt-5-pro')).toBe(false);

        // Image models
        expect(isImageModel('openai', 'dall-e-3')).toBe(true);
        expect(isImageModel('openai', 'dall-e-2')).toBe(true);
        expect(isImageModel('openai', 'gpt-5-image')).toBe(true);
        expect(isImageModel('openai', 'gpt-5-image-mini')).toBe(true);
      });

      it('should correctly identify actual Gemini models', () => {
        // Text models
        expect(isImageModel('gemini', 'gemini-2.0-flash-exp')).toBe(false);
        expect(isImageModel('gemini', 'gemini-1.5-pro')).toBe(false);
        expect(isImageModel('gemini', 'gemini-pro')).toBe(false);

        // Image models (if they exist)
        expect(isImageModel('gemini', 'imagen-3.0')).toBe(true);
      });

      it('should correctly identify actual OpenRouter models', () => {
        // Text models
        expect(isImageModel('openrouter', 'openai/gpt-4-turbo')).toBe(false);
        expect(isImageModel('openrouter', 'anthropic/claude-3.5-sonnet')).toBe(false);
        expect(isImageModel('openrouter', 'meta-llama/llama-3.1-8b-instruct')).toBe(false);

        // Image models
        expect(isImageModel('openrouter', 'openai/dall-e-3')).toBe(true);
      });

      it('should correctly identify actual Anthropic models', () => {
        // All Anthropic models are text-only (as of Jan 2025)
        expect(isImageModel('anthropic', 'claude-3-opus-20240229')).toBe(false);
        expect(isImageModel('anthropic', 'claude-3.5-sonnet-20241022')).toBe(false);
        expect(isImageModel('anthropic', 'claude-3-haiku-20240307')).toBe(false);
      });
    });
  });
});
