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
  AIMLModel,
} from '../fetch-models';

describe('Model Filtering Functions', () => {
  // Mock OpenRouter models data (for OpenRouter-specific functions)
  const mockOpenRouterModels: OpenRouterModel[] = [
    // OpenAI models
    { id: 'openai/gpt-4', name: 'OpenAI: GPT-4', description: 'GPT-4' },
    { id: 'openai/gpt-3.5-turbo', name: 'OpenAI: GPT-3.5 Turbo', description: 'GPT-3.5' },
    { id: 'openai/dall-e-3', name: 'OpenAI: DALL-E 3', description: 'DALL-E 3' },

    // OpenAI OSS models (available on OpenRouter)
    { id: 'openai/gpt-oss-4', name: 'OpenAI: GPT-4 (OSS)', description: 'Open source version' },
    { id: 'openai/gpt-4-oss-turbo', name: 'OpenAI: GPT-4 OSS Turbo', description: 'OSS turbo' },

    // Anthropic models
    { id: 'anthropic/claude-3-opus-20240229', name: 'Anthropic: Claude 3 Opus', description: 'Claude 3 Opus' },
    { id: 'anthropic/claude-3-haiku-20240307', name: 'Anthropic: Claude 3 Haiku', description: 'Claude 3 Haiku' },
    { id: 'anthropic/claude-4-opus-20250514', name: 'Anthropic: Claude 4 Opus', description: 'Claude 4 Opus' },
    { id: 'anthropic/claude-2.0', name: 'Anthropic: Claude 2.0', description: 'Claude 2.0 (retired)' },
    { id: 'anthropic/claude-2.1', name: 'Anthropic: Claude 2.1', description: 'Claude 2.1 (retired)' },
    { id: 'anthropic/claude-3-sonnet-20240229', name: 'Anthropic: Claude 3 Sonnet', description: 'Claude 3 Sonnet (retired)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet', description: 'Claude 3.5 Sonnet (retired)' },

    // Google models
    { id: 'google/gemini-2.5-pro', name: 'Google: Gemini 2.5 Pro', description: 'Gemini 2.5 Pro' },
    { id: 'google/gemini-2.0-flash-exp', name: 'Google: Gemini 2.0 Flash Exp', description: 'Gemini 2.0 Flash' },
    { id: 'google/gemini-3-pro-preview', name: 'Google: Gemini 3 Pro Preview', description: 'Gemini 3 Pro' },
    { id: 'google/imagen-3', name: 'Google: Imagen 3', description: 'Imagen 3' },
    { id: 'google/gemma-3n-e4b-1t', name: 'Google: Gemma 3n 4B', description: 'Open source model' },
    { id: 'google/gemma-3n-e4b-1t:free', name: 'Google: Gemma 3n 4B (free)', description: 'Free open source' },
    { id: 'google/gemma-3n-e2b-1t', name: 'Google: Gemma 3n 2B', description: 'Open source model' },
    { id: 'google/gemma-3-4b-it', name: 'Google: Gemma 3 4B', description: 'Open source model' },
    { id: 'google/gemma-2-9b-it', name: 'Google: Gemma 2 9B', description: 'Open source model' },

    // Other providers
    { id: 'meta-llama/llama-3-8b', name: 'Meta: Llama 3 8B', description: 'Llama 3' },
    { id: 'mistralai/mistral-7b', name: 'Mistral: Mistral 7B', description: 'Mistral 7B' },
  ];

  // Helper to create AIML model
  const createAIMLModel = (id: string, name: string, developer: string, type: string = 'chat-completion'): AIMLModel => ({
    id,
    type,
    info: { name, developer, description: name, contextLength: 8192, maxTokens: 4096, url: '', docs_url: '' },
    features: [],
    endpoints: [],
  });

  // Mock AIML models for OpenAI
  const mockAIMLOpenAIModels: AIMLModel[] = [
    createAIMLModel('openai/gpt-4', 'GPT-4', 'Open AI'),
    createAIMLModel('openai/gpt-3.5-turbo', 'GPT-3.5 Turbo', 'Open AI'),
    createAIMLModel('openai/o1', 'O1', 'Open AI', 'responses'),
    createAIMLModel('openai/gpt-oss-4', 'GPT-4 OSS', 'Open AI'), // OSS - should be filtered
    createAIMLModel('openai/dall-e-3', 'DALL-E 3', 'Open AI', 'image'),
    createAIMLModel('anthropic/claude-3-opus', 'Claude 3 Opus', 'Anthropic'), // Different developer
  ];

  // Mock AIML models for Anthropic
  const mockAIMLAnthropicModels: AIMLModel[] = [
    createAIMLModel('anthropic/claude-3-opus-20240229', 'Claude 3 Opus', 'Anthropic'),
    createAIMLModel('anthropic/claude-3-haiku-20240307', 'Claude 3 Haiku', 'Anthropic'),
    createAIMLModel('anthropic/claude-4-opus-20250514', 'Claude 4 Opus', 'Anthropic'),
    createAIMLModel('anthropic/claude-2.0', 'Claude 2.0', 'Anthropic'), // Retired - should be filtered
    createAIMLModel('anthropic/claude-2.1', 'Claude 2.1', 'Anthropic'), // Retired - should be filtered
    createAIMLModel('anthropic/claude-3-sonnet-20240229', 'Claude 3 Sonnet', 'Anthropic'), // Retired - should be filtered
    createAIMLModel('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'Anthropic'), // Retired - should be filtered
    createAIMLModel('openai/gpt-4', 'GPT-4', 'Open AI'), // Different developer
  ];

  // Mock AIML models for Gemini
  const mockAIMLGeminiModels: AIMLModel[] = [
    createAIMLModel('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'Google'),
    createAIMLModel('google/gemini-2.0-flash-exp', 'Gemini 2.0 Flash Exp', 'Google'),
    createAIMLModel('google/gemini-3-pro-preview', 'Gemini 3 Pro Preview', 'Google'),
    createAIMLModel('google/imagen-3', 'Imagen 3', 'Google', 'image'),
    createAIMLModel('google/gemma-3n-e4b-1t', 'Gemma 3n 4B', 'Google'), // Gemma - should be filtered
    createAIMLModel('google/gemma-3-4b-it', 'Gemma 3 4B', 'Google'), // Gemma - should be filtered
    createAIMLModel('openai/gpt-4', 'GPT-4', 'Open AI'), // Different developer
  ];

  describe('filterModelsByProvider', () => {
    it('should filter models by OpenAI prefix', () => {
      const result = filterModelsByProvider(mockOpenRouterModels, 'openai');
      expect(result.length).toBe(5); // All openai/ models including OSS
      expect(result.every(m => m.id.startsWith('openai/'))).toBe(true);
    });

    it('should filter models by Anthropic prefix', () => {
      const result = filterModelsByProvider(mockOpenRouterModels, 'anthropic');
      expect(result.length).toBe(7); // All anthropic/ models including retired
      expect(result.every(m => m.id.startsWith('anthropic/'))).toBe(true);
    });

    it('should filter models by Google prefix', () => {
      const result = filterModelsByProvider(mockOpenRouterModels, 'google');
      expect(result.length).toBe(9); // All google/ models including Gemma
      expect(result.every(m => m.id.startsWith('google/'))).toBe(true);
    });

    it('should return empty array for provider with no models', () => {
      const result = filterModelsByProvider(mockOpenRouterModels, 'nonexistent' as any);
      expect(result.length).toBe(0);
    });
  });

  describe('getOpenAIModels', () => {
    it('should exclude GPT OSS models', () => {
      const result = getOpenAIModels(mockAIMLOpenAIModels);
      expect(result.some(m => m.value.includes('gpt-oss'))).toBe(false);
      expect(result.some(m => m.value.includes('-oss-'))).toBe(false);
    });

    it('should include legitimate OpenAI text models', () => {
      const result = getOpenAIModels(mockAIMLOpenAIModels);
      expect(result.some(m => m.value === 'openai/gpt-4')).toBe(true);
      expect(result.some(m => m.value === 'openai/gpt-3.5-turbo')).toBe(true);
    });

    it('should include responses API models (like O1)', () => {
      const result = getOpenAIModels(mockAIMLOpenAIModels);
      expect(result.some(m => m.value === 'openai/o1')).toBe(true);
    });

    it('should include DALL-E image models', () => {
      const result = getOpenAIModels(mockAIMLOpenAIModels);
      const imageModels = result.filter(m => m.type === 'image');
      expect(imageModels.length).toBeGreaterThan(0);
      expect(imageModels.some(m => m.value.includes('dall-e'))).toBe(true);
    });

    it('should filter by Open AI developer only', () => {
      const result = getOpenAIModels(mockAIMLOpenAIModels);
      expect(result.some(m => m.value.includes('anthropic'))).toBe(false);
    });
  });

  describe('getAnthropicModels', () => {
    it('should exclude retired Claude 2.x models', () => {
      const result = getAnthropicModels(mockAIMLAnthropicModels);
      expect(result.some(m => m.value.includes('claude-2.0'))).toBe(false);
      expect(result.some(m => m.value.includes('claude-2.1'))).toBe(false);
    });

    it('should exclude retired Claude 3 Sonnet', () => {
      const result = getAnthropicModels(mockAIMLAnthropicModels);
      expect(result.some(m => m.value.includes('claude-3-sonnet'))).toBe(false);
    });

    it('should exclude retired Claude 3.5 Sonnet', () => {
      const result = getAnthropicModels(mockAIMLAnthropicModels);
      expect(result.some(m => m.value.includes('claude-3.5-sonnet'))).toBe(false);
    });

    it('should include active Claude models', () => {
      const result = getAnthropicModels(mockAIMLAnthropicModels);
      expect(result.some(m => m.value.includes('claude-3-opus'))).toBe(true);
      expect(result.some(m => m.value.includes('claude-3-haiku'))).toBe(true);
      expect(result.some(m => m.value.includes('claude-4-opus'))).toBe(true);
    });

    it('should filter by Anthropic developer only', () => {
      const result = getAnthropicModels(mockAIMLAnthropicModels);
      expect(result.some(m => m.value.includes('openai'))).toBe(false);
    });

    it('should sort models in descending order', () => {
      const result = getAnthropicModels(mockAIMLAnthropicModels);
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].label >= result[i + 1].label).toBe(true);
      }
    });
  });

  describe('getGeminiModels', () => {
    it('should exclude Gemma open-source models', () => {
      const result = getGeminiModels(mockAIMLGeminiModels);
      expect(result.some(m => m.value.includes('gemma'))).toBe(false);
    });

    it('should include legitimate Gemini models', () => {
      const result = getGeminiModels(mockAIMLGeminiModels);
      expect(result.some(m => m.value.includes('gemini-2.5-pro'))).toBe(true);
      expect(result.some(m => m.value.includes('gemini-2.0-flash'))).toBe(true);
      expect(result.some(m => m.value.includes('gemini-3-pro'))).toBe(true);
    });

    it('should include Imagen image generation models', () => {
      const result = getGeminiModels(mockAIMLGeminiModels);
      expect(result.some(m => m.value.includes('imagen-3'))).toBe(true);
    });

    it('should filter by Google developer only', () => {
      const result = getGeminiModels(mockAIMLGeminiModels);
      expect(result.some(m => m.value.includes('openai'))).toBe(false);
    });

    it('should sort models in descending order', () => {
      const result = getGeminiModels(mockAIMLGeminiModels);
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].label >= result[i + 1].label).toBe(true);
      }
    });
  });

  describe('getPopularOpenRouterModels', () => {
    it('should include models from popular providers', () => {
      const result = getPopularOpenRouterModels(mockOpenRouterModels);
      expect(result.some(m => m.value.startsWith('openai/'))).toBe(true);
      expect(result.some(m => m.value.startsWith('anthropic/'))).toBe(true);
      expect(result.some(m => m.value.startsWith('google/'))).toBe(true);
      expect(result.some(m => m.value.startsWith('meta-llama/'))).toBe(true);
      expect(result.some(m => m.value.startsWith('mistralai/'))).toBe(true);
    });

    it('should remove provider prefix from labels', () => {
      const result = getPopularOpenRouterModels(mockOpenRouterModels);
      expect(result.some(m => m.label.includes(': '))).toBe(false);
    });

    it('should sort models in descending order', () => {
      const result = getPopularOpenRouterModels(mockOpenRouterModels);
      expect(result.length).toBeGreaterThan(0);
      const labels = result.map(m => m.label);
      const sortedLabels = [...labels].sort((a, b) => b.localeCompare(a));
      expect(labels).toEqual(sortedLabels);
    });

    it('should include OSS and Gemma models for OpenRouter', () => {
      const result = getPopularOpenRouterModels(mockOpenRouterModels);
      expect(result.some(m => m.value.includes('gpt-oss'))).toBe(true);
      expect(result.some(m => m.value.includes('gemma'))).toBe(true);
    });
  });

  describe('Real-world filtering scenarios', () => {
    it('should correctly separate OpenAI API models from OpenRouter OSS models', () => {
      const openaiModels = getOpenAIModels(mockAIMLOpenAIModels);
      const openrouterModels = getPopularOpenRouterModels(mockOpenRouterModels);

      // OpenAI API should NOT have OSS models
      expect(openaiModels.some(m => m.value.includes('oss'))).toBe(false);

      // OpenRouter should have OSS models available
      expect(openrouterModels.some(m => m.value.includes('gpt-oss'))).toBe(true);
    });

    it('should correctly separate Gemini API models from OpenRouter Gemma models', () => {
      const geminiModels = getGeminiModels(mockAIMLGeminiModels);
      const openrouterModels = getPopularOpenRouterModels(mockOpenRouterModels);

      // Gemini API should NOT have Gemma models
      expect(geminiModels.some(m => m.value.toLowerCase().includes('gemma'))).toBe(false);

      // OpenRouter should have Gemma models available
      expect(openrouterModels.some(m => m.value.includes('gemma'))).toBe(true);
    });
  });
});
