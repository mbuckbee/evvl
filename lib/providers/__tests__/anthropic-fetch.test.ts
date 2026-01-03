/**
 * Tests for Anthropic fetch-based provider
 */

import { generateText, ModelNotAvailableError } from '../anthropic-fetch';

// Mock global fetch
global.fetch = jest.fn();

describe('anthropic-fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateText', () => {
    it('should successfully generate text', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'This is Claude\'s response',
          },
        ],
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'claude-3-5-sonnet-20241022',
        prompt: 'Hello Claude',
        apiKey: 'sk-ant-test',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'x-api-key': 'sk-ant-test',
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: [{ role: 'user', content: 'Hello Claude' }],
          }),
        }
      );

      expect(result.content).toBe('This is Claude\'s response');
      expect(result.tokens).toBe(30); // 10 + 20
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should handle model not available error (404)', async () => {
      const mockError = {
        type: 'not_found_error',
        message: 'Model not found',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockError,
      });

      await expect(
        generateText({
          model: 'invalid-model',
          prompt: 'Test',
          apiKey: 'sk-ant-test',
        })
      ).rejects.toThrow(ModelNotAvailableError);
    });

    it('should throw helpful message for unavailable models', async () => {
      const mockError = {
        type: 'not_found_error',
        message: 'Model not found',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockError,
      });

      await expect(
        generateText({
          model: 'invalid-model',
          prompt: 'Test',
          apiKey: 'sk-ant-test',
        })
      ).rejects.toThrow('This model is not available through Anthropic\'s direct API');
    });

    it('should handle model not available error (error type)', async () => {
      const mockError = {
        error: {
          type: 'not_found_error',
          message: 'The model does not exist',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      await expect(
        generateText({
          model: 'claude-2',
          prompt: 'Test',
          apiKey: 'sk-ant-test',
        })
      ).rejects.toThrow(ModelNotAvailableError);
    });

    it('should handle model error in message', async () => {
      const mockError = {
        error: {
          message: 'This model is not available',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      await expect(
        generateText({
          model: 'some-model',
          prompt: 'Test',
          apiKey: 'sk-ant-test',
        })
      ).rejects.toThrow(ModelNotAvailableError);
    });

    it('should handle general API errors', async () => {
      const mockError = {
        error: {
          message: 'Invalid API key',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockError,
      });

      await expect(
        generateText({
          model: 'claude-3-5-sonnet-20241022',
          prompt: 'Test',
          apiKey: 'invalid-key',
        })
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network timeout'));

      await expect(
        generateText({
          model: 'claude-3-5-sonnet-20241022',
          prompt: 'Test',
          apiKey: 'sk-ant-test',
        })
      ).rejects.toThrow('Network timeout');
    });

    it('should handle empty content', async () => {
      const mockResponse = {
        content: [],
        usage: {
          input_tokens: 10,
          output_tokens: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'claude-3-5-sonnet-20241022',
        prompt: 'Test',
        apiKey: 'sk-ant-test',
      });

      expect(result.content).toBe('');
      expect(result.tokens).toBe(10);
    });

    it('should handle non-text content', async () => {
      const mockResponse = {
        content: [
          {
            type: 'image',
            data: 'base64...',
          },
        ],
        usage: {
          input_tokens: 5,
          output_tokens: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'claude-3-5-sonnet-20241022',
        prompt: 'Test',
        apiKey: 'sk-ant-test',
      });

      expect(result.content).toBe('');
    });

    it('should handle missing usage data', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'Response',
          },
        ],
        usage: {},
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'claude-3-5-sonnet-20241022',
        prompt: 'Test',
        apiKey: 'sk-ant-test',
      });

      expect(result.tokens).toBe(0);
    });
  });

  describe('ModelNotAvailableError', () => {
    it('should be an instance of Error', () => {
      const error = new ModelNotAvailableError('Test message');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ModelNotAvailableError');
      expect(error.message).toBe('Test message');
    });
  });
});
