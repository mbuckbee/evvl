/**
 * Tests for OpenRouter fetch-based provider
 */

import { generateText } from '../openrouter-fetch';

// Mock global fetch
global.fetch = jest.fn();

describe('openrouter-fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateText', () => {
    it('should successfully generate text', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Response from DeepSeek',
            },
          },
        ],
        usage: {
          total_tokens: 42,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'deepseek/deepseek-chat',
        prompt: 'Hello AI',
        apiKey: 'sk-or-test',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk-or-test',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-chat',
            messages: [{ role: 'user', content: 'Hello AI' }],
          }),
        }
      );

      expect(result.content).toBe('Response from DeepSeek');
      expect(result.tokens).toBe(42);
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should work with various model formats', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { total_tokens: 10 },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Test with different model name formats
      await generateText({
        model: 'meta-llama/llama-3.1-70b-instruct',
        prompt: 'Test',
        apiKey: 'sk-or-test',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('meta-llama/llama-3.1-70b-instruct'),
        })
      );
    });

    it('should handle API errors', async () => {
      const mockError = {
        error: {
          message: 'Insufficient credits',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Payment Required',
        json: async () => mockError,
      });

      await expect(
        generateText({
          model: 'deepseek/deepseek-chat',
          prompt: 'Test',
          apiKey: 'sk-or-test',
        })
      ).rejects.toThrow('Insufficient credits');
    });

    it('should handle rate limit errors', async () => {
      const mockError = {
        error: {
          message: 'Rate limit exceeded',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Too Many Requests',
        json: async () => mockError,
      });

      await expect(
        generateText({
          model: 'deepseek/deepseek-chat',
          prompt: 'Test',
          apiKey: 'sk-or-test',
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle invalid model errors', async () => {
      const mockError = {
        error: {
          message: 'Model not found',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => mockError,
      });

      await expect(
        generateText({
          model: 'invalid/model',
          prompt: 'Test',
          apiKey: 'sk-or-test',
        })
      ).rejects.toThrow('Model not found');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch')
      );

      await expect(
        generateText({
          model: 'deepseek/deepseek-chat',
          prompt: 'Test',
          apiKey: 'sk-or-test',
        })
      ).rejects.toThrow('Failed to fetch');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: [],
        usage: {},
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'deepseek/deepseek-chat',
        prompt: 'Test',
        apiKey: 'sk-or-test',
      });

      expect(result.content).toBe('');
      expect(result.tokens).toBe(0);
    });

    it('should handle malformed JSON error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        generateText({
          model: 'deepseek/deepseek-chat',
          prompt: 'Test',
          apiKey: 'sk-or-test',
        })
      ).rejects.toThrow('Internal Server Error');
    });

    it('should handle response with missing usage data', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Response',
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'deepseek/deepseek-chat',
        prompt: 'Test',
        apiKey: 'sk-or-test',
      });

      expect(result.content).toBe('Response');
      expect(result.tokens).toBe(0);
    });
  });
});
