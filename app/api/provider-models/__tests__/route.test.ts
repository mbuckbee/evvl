/**
 * Tests for /api/provider-models endpoint
 *
 * @jest-environment node
 *
 * This endpoint fetches model lists from provider APIs using server-side keys.
 * Tests verify:
 * 1. Response structure is correct
 * 2. Missing API keys are handled gracefully
 * 3. Provider filtering works
 * 4. Discovery errors are caught and reported
 * 5. Model conversion to ProviderModel format works
 */

import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '../route';
import * as discovery from '@/lib/discovery';

// Mock the discovery module
jest.mock('@/lib/discovery', () => ({
  discoverOpenAIModels: jest.fn(),
  discoverAnthropicModels: jest.fn(),
  discoverGeminiModels: jest.fn(),
}));

// Store original fetch and env
const originalFetch = global.fetch;
const originalEnv = process.env;

// Create mock fetch function
const mockFetch = jest.fn();

describe('GET /api/provider-models', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global fetch
    global.fetch = mockFetch;
    // Reset environment
    process.env = { ...originalEnv };
    // Clear API keys by default
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  describe('Response Structure', () => {
    it('should return correct response structure with all providers', async () => {
      // Mock OpenRouter response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('providers');
          expect(data).toHaveProperty('cachedAt');
          expect(typeof data.cachedAt).toBe('number');

          // Check all providers exist in response
          expect(data.providers).toHaveProperty('openai');
          expect(data.providers).toHaveProperty('anthropic');
          expect(data.providers).toHaveProperty('gemini');
          expect(data.providers).toHaveProperty('openrouter');

          // Each provider should have available and models properties
          ['openai', 'anthropic', 'gemini', 'openrouter'].forEach(provider => {
            expect(data.providers[provider]).toHaveProperty('available');
            expect(data.providers[provider]).toHaveProperty('models');
            expect(Array.isArray(data.providers[provider].models)).toBe(true);
          });
        },
      });
    });

    it('should include Cache-Control header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });

          expect(response.headers.get('Cache-Control')).toBe(
            'public, s-maxage=3600, stale-while-revalidate=86400'
          );
        },
      });
    });
  });

  describe('Missing API Keys', () => {
    it('should report error when OpenAI API key is missing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.openai.available).toBe(false);
          expect(data.providers.openai.error).toBe('No API key configured');
          expect(data.providers.openai.models).toEqual([]);
        },
      });
    });

    it('should report error when Anthropic API key is missing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.anthropic.available).toBe(false);
          expect(data.providers.anthropic.error).toBe('No API key configured');
        },
      });
    });

    it('should report error when Gemini API key is missing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.gemini.available).toBe(false);
          expect(data.providers.gemini.error).toBe('No API key configured');
        },
      });
    });
  });

  describe('Successful Discovery', () => {
    it('should return OpenAI models when API key is configured', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const mockModels = [
        { id: 'gpt-4', displayName: 'GPT-4', provider: 'openai', modelType: 'chat-completion' },
        { id: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo', provider: 'openai', modelType: 'chat-completion' },
      ];

      (discovery.discoverOpenAIModels as jest.Mock).mockResolvedValue({
        success: true,
        models: mockModels,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.openai.available).toBe(true);
          expect(data.providers.openai.models).toHaveLength(2);
          expect(data.providers.openai.models[0]).toEqual({
            id: 'gpt-4',
            displayName: 'GPT-4',
            provider: 'openai',
            type: 'chat-completion',
            created: undefined,
          });
        },
      });
    });

    it('should return Anthropic models when API key is configured', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      const mockModels = [
        { id: 'claude-3-opus', displayName: 'Claude 3 Opus', provider: 'anthropic', modelType: 'chat' },
      ];

      (discovery.discoverAnthropicModels as jest.Mock).mockResolvedValue({
        success: true,
        models: mockModels,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.anthropic.available).toBe(true);
          expect(data.providers.anthropic.models).toHaveLength(1);
          expect(data.providers.anthropic.models[0].id).toBe('claude-3-opus');
        },
      });
    });

    it('should return Gemini models when API key is configured', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const mockModels = [
        { id: 'gemini-pro', displayName: 'Gemini Pro', provider: 'gemini', modelType: 'chat' },
      ];

      (discovery.discoverGeminiModels as jest.Mock).mockResolvedValue({
        success: true,
        models: mockModels,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.gemini.available).toBe(true);
          expect(data.providers.gemini.models).toHaveLength(1);
          expect(data.providers.gemini.models[0].id).toBe('gemini-pro');
        },
      });
    });
  });

  describe('OpenRouter (No API Key Required)', () => {
    it('should fetch OpenRouter models without API key', async () => {
      const mockOpenRouterModels = [
        { id: 'openai/gpt-4', name: 'GPT-4', created: 1234567890 },
        { id: 'anthropic/claude-3', name: 'Claude 3', created: 1234567891 },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockOpenRouterModels }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.openrouter.available).toBe(true);
          expect(data.providers.openrouter.models).toHaveLength(2);
          expect(data.providers.openrouter.models[0]).toEqual({
            id: 'openai/gpt-4',
            displayName: 'GPT-4',
            provider: 'openrouter',
            type: 'chat',
            created: 1234567890,
          });
        },
      });
    });

    it('should handle OpenRouter API failure gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.openrouter.available).toBe(false);
          expect(data.providers.openrouter.models).toEqual([]);
        },
      });
    });
  });

  describe('Provider Filtering', () => {
    it('should only fetch OpenAI when provider=openai', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      (discovery.discoverOpenAIModels as jest.Mock).mockResolvedValue({
        success: true,
        models: [{ id: 'gpt-4', displayName: 'GPT-4', provider: 'openai', modelType: 'chat' }],
      });

      await testApiHandler({
        appHandler,
        url: '?provider=openai',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          // OpenAI should be fetched
          expect(discovery.discoverOpenAIModels).toHaveBeenCalled();
          expect(data.providers.openai.available).toBe(true);

          // Others should not be fetched (default empty state)
          expect(discovery.discoverAnthropicModels).not.toHaveBeenCalled();
          expect(discovery.discoverGeminiModels).not.toHaveBeenCalled();
          expect(mockFetch).not.toHaveBeenCalled(); // OpenRouter
        },
      });
    });

    it('should only fetch Anthropic when provider=anthropic', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      (discovery.discoverAnthropicModels as jest.Mock).mockResolvedValue({
        success: true,
        models: [{ id: 'claude-3', displayName: 'Claude 3', provider: 'anthropic', modelType: 'chat' }],
      });

      await testApiHandler({
        appHandler,
        url: '?provider=anthropic',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(discovery.discoverAnthropicModels).toHaveBeenCalled();
          expect(data.providers.anthropic.available).toBe(true);

          expect(discovery.discoverOpenAIModels).not.toHaveBeenCalled();
          expect(discovery.discoverGeminiModels).not.toHaveBeenCalled();
        },
      });
    });

    it('should only fetch OpenRouter when provider=openrouter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'model-1', name: 'Model 1' }] }),
      });

      await testApiHandler({
        appHandler,
        url: '?provider=openrouter',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(mockFetch).toHaveBeenCalledWith(
            'https://openrouter.ai/api/v1/models',
            expect.any(Object)
          );
          expect(data.providers.openrouter.available).toBe(true);

          expect(discovery.discoverOpenAIModels).not.toHaveBeenCalled();
          expect(discovery.discoverAnthropicModels).not.toHaveBeenCalled();
          expect(discovery.discoverGeminiModels).not.toHaveBeenCalled();
        },
      });
    });
  });

  describe('Discovery Errors', () => {
    it('should handle OpenAI discovery failure', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      (discovery.discoverOpenAIModels as jest.Mock).mockResolvedValue({
        success: false,
        models: [],
        error: 'Invalid API key',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.openai.available).toBe(false);
          expect(data.providers.openai.error).toBe('Invalid API key');
          expect(data.providers.openai.models).toEqual([]);
        },
      });
    });

    it('should handle discovery exception', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      (discovery.discoverOpenAIModels as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.openai.available).toBe(false);
          expect(data.providers.openai.error).toBe('Network error');
        },
      });
    });
  });

  describe('Model Conversion', () => {
    it('should convert discovered models to ProviderModel format', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const discoveredModel = {
        id: 'gpt-4o',
        displayName: 'GPT-4o',
        provider: 'openai',
        modelType: 'chat-completion',
        created: 1699000000,
        ownedBy: 'openai',
      };

      (discovery.discoverOpenAIModels as jest.Mock).mockResolvedValue({
        success: true,
        models: [discoveredModel],
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          const model = data.providers.openai.models[0];
          expect(model).toEqual({
            id: 'gpt-4o',
            displayName: 'GPT-4o',
            provider: 'openai',
            type: 'chat-completion',
            created: 1699000000,
          });
        },
      });
    });

    it('should use model id as displayName when displayName is missing', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      (discovery.discoverOpenAIModels as jest.Mock).mockResolvedValue({
        success: true,
        models: [{ id: 'gpt-4', provider: 'openai' }], // No displayName
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.openai.models[0].displayName).toBe('gpt-4');
        },
      });
    });

    it('should default to "chat" type when modelType is missing', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      (discovery.discoverOpenAIModels as jest.Mock).mockResolvedValue({
        success: true,
        models: [{ id: 'gpt-4', displayName: 'GPT-4', provider: 'openai' }], // No modelType
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(data.providers.openai.models[0].type).toBe('chat');
        },
      });
    });
  });
});
