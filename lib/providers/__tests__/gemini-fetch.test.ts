/**
 * Tests for Google Gemini fetch-based provider
 */

import { generateText, generateImage } from '../gemini-fetch';

// Mock global fetch
global.fetch = jest.fn();

describe('gemini-fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateText', () => {
    it('should successfully generate text', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'This is Gemini\'s response',
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'gemini-1.5-pro',
        prompt: 'Hello Gemini',
        apiKey: 'test-api-key',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=test-api-key',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Hello Gemini' }],
            }],
          }),
        }
      );

      expect(result.content).toBe('This is Gemini\'s response');
      expect(result.tokens).toBeGreaterThan(0);
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should calculate approximate token count', async () => {
      const prompt = 'Short';
      const response = 'Also short';
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: response }],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'gemini-1.5-pro',
        prompt,
        apiKey: 'test-api-key',
      });

      // Token count should be approximately (prompt.length + response.length) / 4
      const expectedTokens = Math.ceil((prompt.length + response.length) / 4);
      expect(result.tokens).toBe(expectedTokens);
    });

    it('should handle API errors', async () => {
      const mockError = {
        error: {
          message: 'API key not valid',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Forbidden',
        json: async () => mockError,
      });

      await expect(
        generateText({
          model: 'gemini-1.5-pro',
          prompt: 'Test',
          apiKey: 'invalid-key',
        })
      ).rejects.toThrow('API key not valid');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network connection failed')
      );

      await expect(
        generateText({
          model: 'gemini-1.5-pro',
          prompt: 'Test',
          apiKey: 'test-api-key',
        })
      ).rejects.toThrow('Network connection failed');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        candidates: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'gemini-1.5-pro',
        prompt: 'Test',
        apiKey: 'test-api-key',
      });

      expect(result.content).toBe('');
    });

    it('should handle missing parts in response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateText({
        model: 'gemini-1.5-pro',
        prompt: 'Test',
        apiKey: 'test-api-key',
      });

      expect(result.content).toBe('');
    });

    it('should handle malformed error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Gateway',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        generateText({
          model: 'gemini-1.5-pro',
          prompt: 'Test',
          apiKey: 'test-api-key',
        })
      ).rejects.toThrow('Bad Gateway');
    });
  });

  describe('generateImage', () => {
    it('should successfully generate image', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Enhanced image prompt',
                },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'base64encodedimagedata',
                  },
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateImage({
        model: 'gemini-2.0-flash-exp',
        prompt: 'A sunset',
        apiKey: 'test-api-key',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=test-api-key',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'A sunset' }],
            }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        }
      );

      expect(result.imageUrl).toBe('data:image/png;base64,base64encodedimagedata');
      expect(result.revisedPrompt).toBe('Enhanced image prompt');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should use original prompt when no text part returned', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: 'imagedata',
                  },
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateImage({
        model: 'gemini-2.0-flash-exp',
        prompt: 'Original prompt',
        apiKey: 'test-api-key',
      });

      expect(result.revisedPrompt).toBe('Original prompt');
    });

    it('should default to image/png when mime type missing', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: 'imagedata',
                    // mimeType is missing, should default to image/png
                  },
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateImage({
        model: 'gemini-2.0-flash-exp',
        prompt: 'Test',
        apiKey: 'test-api-key',
      });

      expect(result.imageUrl).toBe('data:image/png;base64,imagedata');
    });

    it('should throw error when no image data returned', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Only text, no image',
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(
        generateImage({
          model: 'gemini-2.0-flash-exp',
          prompt: 'Test',
          apiKey: 'test-api-key',
        })
      ).rejects.toThrow('No image data returned from Gemini');
    });

    it('should throw error when empty response', async () => {
      const mockResponse = {
        candidates: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(
        generateImage({
          model: 'gemini-2.0-flash-exp',
          prompt: 'Test',
          apiKey: 'test-api-key',
        })
      ).rejects.toThrow('No image data returned from Gemini');
    });

    it('should handle API errors', async () => {
      const mockError = {
        error: {
          message: 'Content filtering triggered',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => mockError,
      });

      await expect(
        generateImage({
          model: 'gemini-2.0-flash-exp',
          prompt: 'Inappropriate content',
          apiKey: 'test-api-key',
        })
      ).rejects.toThrow('Content filtering triggered');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Connection timeout')
      );

      await expect(
        generateImage({
          model: 'gemini-2.0-flash-exp',
          prompt: 'Test',
          apiKey: 'test-api-key',
        })
      ).rejects.toThrow('Connection timeout');
    });
  });
});
