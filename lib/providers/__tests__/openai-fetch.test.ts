/**
 * Tests for OpenAI fetch-based provider
 */

import { generateText, generateImage } from '../openai-fetch';

// Mock global fetch
global.fetch = jest.fn();

describe('openai-fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateText', () => {
    it('should successfully generate text', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a test response',
            },
          },
        ],
        usage: {
          total_tokens: 25,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'gpt-4',
        prompt: 'Test prompt',
        apiKey: 'sk-test',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk-test',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'Test prompt' }],
          }),
        }
      );

      expect(result.content).toBe('This is a test response');
      expect(result.tokens).toBe(25);
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should handle API errors', async () => {
      const mockError = {
        error: {
          message: 'Invalid API key',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => mockError,
      });

      await expect(
        generateText({
          model: 'gpt-4',
          prompt: 'Test prompt',
          apiKey: 'invalid-key',
        })
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        generateText({
          model: 'gpt-4',
          prompt: 'Test prompt',
          apiKey: 'sk-test',
        })
      ).rejects.toThrow('Network error');
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
        model: 'gpt-4',
        prompt: 'Test prompt',
        apiKey: 'sk-test',
      });

      expect(result.content).toBe('');
      expect(result.tokens).toBe(0);
    });
  });

  describe('generateImage', () => {
    it('should successfully generate image', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
            revised_prompt: 'Enhanced prompt',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateImage({
        model: 'dall-e-3',
        prompt: 'A cat',
        apiKey: 'sk-test',
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk-test',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: 'A cat',
            n: 1,
            size: '1024x1024',
            quality: 'hd',
            style: 'vivid',
            response_format: 'url',
          }),
        }
      );

      expect(result.imageUrl).toBe('https://example.com/image.png');
      expect(result.revisedPrompt).toBe('Enhanced prompt');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should use default values when optional params not provided', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateImage({
        model: 'dall-e-2',
        prompt: 'A dog',
        apiKey: 'sk-test',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/images/generations',
        expect.objectContaining({
          body: expect.stringContaining('"size":"1024x1024"'),
        })
      );

      expect(result.imageUrl).toBe('https://example.com/image.png');
      expect(result.revisedPrompt).toBe('A dog'); // Falls back to original prompt
    });

    it('should handle API errors', async () => {
      const mockError = {
        error: {
          message: 'Content policy violation',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => mockError,
      });

      await expect(
        generateImage({
          model: 'dall-e-3',
          prompt: 'Inappropriate content',
          apiKey: 'sk-test',
        })
      ).rejects.toThrow('Content policy violation');
    });

    it('should throw error when no image data returned', async () => {
      const mockResponse = {
        data: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(
        generateImage({
          model: 'dall-e-3',
          prompt: 'A cat',
          apiKey: 'sk-test',
        })
      ).rejects.toThrow('No image data returned from OpenAI');
    });

    it('should throw error when no URL in response', async () => {
      const mockResponse = {
        data: [{}],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(
        generateImage({
          model: 'dall-e-3',
          prompt: 'A cat',
          apiKey: 'sk-test',
        })
      ).rejects.toThrow('No image URL returned from OpenAI');
    });
  });
});
