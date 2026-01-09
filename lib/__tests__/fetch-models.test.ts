/**
 * Tests for Model Fetching and Filtering Functions
 */

import {
  filterModelsByProvider,
  getOpenAIModels,
  getAnthropicModels,
  getGeminiModels,
  getPopularOpenRouterModels,
  OpenRouterModel,
} from '../fetch-models';

describe('Model Filtering Functions', () => {
  // Mock OpenRouter models data
  const mockModels: OpenRouterModel[] = [
    // OpenAI models
    { id: 'openai/gpt-4', name: 'OpenAI: GPT-4', description: 'GPT-4' },
    { id: 'openai/gpt-3.5-turbo', name: 'OpenAI: GPT-3.5 Turbo', description: 'GPT-3.5' },
    { id: 'openai/dall-e-3', name: 'OpenAI: DALL-E 3', description: 'DALL-E 3' },

    // OpenAI OSS models (should be filtered out)
    { id: 'openai/gpt-oss-4', name: 'OpenAI: GPT-4 (OSS)', description: 'Open source version' },
    { id: 'openai/gpt-4-oss-turbo', name: 'OpenAI: GPT-4 OSS Turbo', description: 'OSS turbo' },

    // Anthropic models
    { id: 'anthropic/claude-3-opus-20240229', name: 'Anthropic: Claude 3 Opus', description: 'Claude 3 Opus' },
    { id: 'anthropic/claude-3-haiku-20240307', name: 'Anthropic: Claude 3 Haiku', description: 'Claude 3 Haiku' },
    { id: 'anthropic/claude-4-opus-20250514', name: 'Anthropic: Claude 4 Opus', description: 'Claude 4 Opus' },

    // Retired Anthropic models (should be filtered out)
    { id: 'anthropic/claude-2.0', name: 'Anthropic: Claude 2.0', description: 'Claude 2.0 (retired)' },
    { id: 'anthropic/claude-2.1', name: 'Anthropic: Claude 2.1', description: 'Claude 2.1 (retired)' },
    { id: 'anthropic/claude-3-sonnet-20240229', name: 'Anthropic: Claude 3 Sonnet', description: 'Claude 3 Sonnet (retired)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet', description: 'Claude 3.5 Sonnet (retired)' },

    // Google Gemini models
    { id: 'google/gemini-2.5-pro', name: 'Google: Gemini 2.5 Pro', description: 'Gemini 2.5 Pro' },
    { id: 'google/gemini-2.0-flash-exp', name: 'Google: Gemini 2.0 Flash Exp', description: 'Gemini 2.0 Flash' },
    { id: 'google/gemini-3-pro-preview', name: 'Google: Gemini 3 Pro Preview', description: 'Gemini 3 Pro' },
    { id: 'google/imagen-3', name: 'Google: Imagen 3', description: 'Imagen 3' },

    // Google Gemma models (should be filtered out - open source only)
    { id: 'google/gemma-3n-e4b-1t', name: 'Google: Gemma 3n 4B', description: 'Open source model' },
    { id: 'google/gemma-3n-e4b-1t:free', name: 'Google: Gemma 3n 4B (free)', description: 'Free open source' },
    { id: 'google/gemma-3n-e2b-1t', name: 'Google: Gemma 3n 2B', description: 'Open source model' },
    { id: 'google/gemma-3-4b-it', name: 'Google: Gemma 3 4B', description: 'Open source model' },
    { id: 'google/gemma-2-9b-it', name: 'Google: Gemma 2 9B', description: 'Open source model' },

    // Other providers
    { id: 'meta-llama/llama-3-8b', name: 'Meta: Llama 3 8B', description: 'Llama 3' },
    { id: 'mistralai/mistral-7b', name: 'Mistral: Mistral 7B', description: 'Mistral 7B' },
  ];

  describe('filterModelsByProvider', () => {
    it('should filter models by OpenAI prefix', () => {
      const result = filterModelsByProvider(mockModels, 'openai');
      expect(result.length).toBe(5); // All openai/ models including OSS
      expect(result.every(m => m.id.startsWith('openai/'))).toBe(true);
    });

    it('should filter models by Anthropic prefix', () => {
      const result = filterModelsByProvider(mockModels, 'anthropic');
      expect(result.length).toBe(7); // All anthropic/ models including retired
      expect(result.every(m => m.id.startsWith('anthropic/'))).toBe(true);
    });

    it('should filter models by Google prefix', () => {
      const result = filterModelsByProvider(mockModels, 'google');
      expect(result.length).toBe(9); // All google/ models including Gemma
      expect(result.every(m => m.id.startsWith('google/'))).toBe(true);
    });

    it('should return empty array for provider with no models', () => {
      const result = filterModelsByProvider(mockModels, 'nonexistent' as any);
      expect(result.length).toBe(0);
    });
  });

  describe('getOpenAIModels', () => {
    it('should exclude GPT OSS models', () => {
      const result = getOpenAIModels(mockModels);
      expect(result.some(m => m.value.includes('gpt-oss'))).toBe(false);
      expect(result.some(m => m.value.includes('-oss-'))).toBe(false);
    });

    it('should include legitimate OpenAI models', () => {
      const result = getOpenAIModels(mockModels);
      expect(result.some(m => m.value === 'openai/gpt-4')).toBe(true);
      expect(result.some(m => m.value === 'openai/gpt-3.5-turbo')).toBe(true);
    });

    it('should include DALL-E image models at the top', () => {
      const result = getOpenAIModels(mockModels);
      expect(result[0].value).toBe('dall-e-3');
      expect(result[0].label).toContain('DALL-E 3');
      expect(result[1].value).toBe('dall-e-2');
      expect(result[1].label).toContain('DALL-E 2');
    });

    it('should remove "OpenAI: " prefix from labels', () => {
      const result = getOpenAIModels(mockModels);
      expect(result.every(m => !m.label.startsWith('OpenAI: '))).toBe(true);
    });

    it('should sort models in descending order', () => {
      const result = getOpenAIModels(mockModels);
      // Skip the first two (DALL-E models), check text models are sorted
      const textModels = result.slice(2);
      for (let i = 0; i < textModels.length - 1; i++) {
        expect(textModels[i].label >= textModels[i + 1].label).toBe(true);
      }
    });
  });

  describe('getAnthropicModels', () => {
    it('should exclude retired Claude 2.x models', () => {
      const result = getAnthropicModels(mockModels);
      expect(result.some(m => m.value.includes('claude-2.0'))).toBe(false);
      expect(result.some(m => m.value.includes('claude-2.1'))).toBe(false);
    });

    it('should exclude retired Claude 3 Sonnet', () => {
      const result = getAnthropicModels(mockModels);
      expect(result.some(m => m.value.includes('claude-3-sonnet'))).toBe(false);
    });

    it('should exclude retired Claude 3.5 Sonnet', () => {
      const result = getAnthropicModels(mockModels);
      expect(result.some(m => m.value.includes('claude-3.5-sonnet'))).toBe(false);
    });

    it('should include active Claude models', () => {
      const result = getAnthropicModels(mockModels);
      expect(result.some(m => m.value.includes('claude-3-opus'))).toBe(true);
      expect(result.some(m => m.value.includes('claude-3-haiku'))).toBe(true);
      expect(result.some(m => m.value.includes('claude-4-opus'))).toBe(true);
    });

    it('should remove "Anthropic: " prefix from labels', () => {
      const result = getAnthropicModels(mockModels);
      expect(result.every(m => !m.label.startsWith('Anthropic: '))).toBe(true);
    });

    it('should sort models in descending order', () => {
      const result = getAnthropicModels(mockModels);
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].label >= result[i + 1].label).toBe(true);
      }
    });
  });

  describe('getGeminiModels', () => {
    it('should exclude Gemma open-source models (NOT available through Gemini API)', () => {
      const result = getGeminiModels(mockModels);
      expect(result.some(m => m.value.includes('gemma'))).toBe(false);
    });

    it('should include legitimate Gemini models', () => {
      const result = getGeminiModels(mockModels);
      expect(result.some(m => m.value.includes('gemini-2.5-pro'))).toBe(true);
      expect(result.some(m => m.value.includes('gemini-2.0-flash'))).toBe(true);
      expect(result.some(m => m.value.includes('gemini-3-pro'))).toBe(true);
    });

    it('should include Imagen image generation models', () => {
      const result = getGeminiModels(mockModels);
      expect(result.some(m => m.value.includes('imagen-3'))).toBe(true);
    });

    it('should remove "Google: " prefix from labels', () => {
      const result = getGeminiModels(mockModels);
      expect(result.every(m => !m.label.startsWith('Google: '))).toBe(true);
    });

    it('should sort models in descending order', () => {
      const result = getGeminiModels(mockModels);
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].label >= result[i + 1].label).toBe(true);
      }
    });

    it('should filter out all Gemma variants (free, paid, different versions)', () => {
      const result = getGeminiModels(mockModels);
      // Count Gemma models in mock data
      const gemmaCount = mockModels.filter(m => m.id.includes('gemma')).length;
      expect(gemmaCount).toBeGreaterThan(0); // Verify we have Gemma models in test data
      // Verify none made it through the filter
      expect(result.some(m => m.value.toLowerCase().includes('gemma'))).toBe(false);
    });
  });

  describe('getPopularOpenRouterModels', () => {
    it('should include models from popular providers', () => {
      const result = getPopularOpenRouterModels(mockModels);
      // Should include openai, anthropic, google, meta-llama, mistralai
      expect(result.some(m => m.value.startsWith('openai/'))).toBe(true);
      expect(result.some(m => m.value.startsWith('anthropic/'))).toBe(true);
      expect(result.some(m => m.value.startsWith('google/'))).toBe(true);
      expect(result.some(m => m.value.startsWith('meta-llama/'))).toBe(true);
      expect(result.some(m => m.value.startsWith('mistralai/'))).toBe(true);
    });

    it('should remove provider prefix from labels', () => {
      const result = getPopularOpenRouterModels(mockModels);
      // Labels should not contain "Provider: " format
      // e.g., "GPT-4" not "OpenAI: GPT-4"
      expect(result.some(m => m.label.includes(': '))).toBe(false);
    });

    it('should sort models in descending order', () => {
      const result = getPopularOpenRouterModels(mockModels);
      // Verify we have results and they're sorted
      expect(result.length).toBeGreaterThan(0);
      // Note: OpenRouter extracts labels differently (splits on ': '),
      // so sorting may vary based on the second part of the name
      const labels = result.map(m => m.label);
      const sortedLabels = [...labels].sort((a, b) => b.localeCompare(a));
      expect(labels).toEqual(sortedLabels);
    });

    it('should include OSS and Gemma models for OpenRouter (since they can be called via OpenRouter)', () => {
      const result = getPopularOpenRouterModels(mockModels);
      // OpenRouter should include OSS models since they're available on OpenRouter
      expect(result.some(m => m.value.includes('gpt-oss'))).toBe(true);
      // OpenRouter should include Gemma models since they're available on OpenRouter
      expect(result.some(m => m.value.includes('gemma'))).toBe(true);
    });
  });

  describe('Real-world filtering scenarios', () => {
    it('should correctly separate OpenAI API models from OpenRouter OSS models', () => {
      const openaiModels = getOpenAIModels(mockModels);
      const openrouterModels = getPopularOpenRouterModels(mockModels);

      // OpenAI API should NOT have OSS models
      expect(openaiModels.some(m => m.value.includes('oss'))).toBe(false);

      // OpenRouter should have OSS models available
      expect(openrouterModels.some(m => m.value.includes('gpt-oss'))).toBe(true);
    });

    it('should correctly separate Gemini API models from OpenRouter Gemma models', () => {
      const geminiModels = getGeminiModels(mockModels);
      const openrouterModels = getPopularOpenRouterModels(mockModels);

      // Gemini API should NOT have Gemma models (they're only on OpenRouter)
      expect(geminiModels.some(m => m.value.toLowerCase().includes('gemma'))).toBe(false);

      // OpenRouter should have Gemma models available
      expect(openrouterModels.some(m => m.value.includes('gemma'))).toBe(true);
    });

    it('should only show models callable by each provider API', () => {
      const openaiModels = getOpenAIModels(mockModels);
      const anthropicModels = getAnthropicModels(mockModels);
      const geminiModels = getGeminiModels(mockModels);

      // Each provider should only have models they can actually call
      expect(openaiModels.every(m => {
        // DALL-E or openai/ prefix (excluding OSS)
        return m.value.includes('dall-e') ||
               (m.value.startsWith('openai/') && !m.value.includes('oss'));
      })).toBe(true);

      expect(anthropicModels.every(m =>
        m.value.startsWith('anthropic/')
      )).toBe(true);

      expect(geminiModels.every(m =>
        // Gemini API supports Gemini models (not Gemma), all with google/ prefix
        m.value.startsWith('google/') && !m.value.toLowerCase().includes('gemma')
      )).toBe(true);
    });
  });
});
