/**
 * API Route Tests
 *
 * Tests for the /api/generate endpoint using next-test-api-route-handler
 *
 * @jest-environment node
 */

import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '../route';
import * as providers from '@/lib/providers';

// Mock the provider functions individually
jest.mock('@/lib/providers', () => {
  const actual = jest.requireActual('@/lib/providers');
  return {
    ...actual,
    openai: {
      generateText: jest.fn(),
    },
    anthropic: {
      generateText: jest.fn(),
    },
    openrouter: {
      generateText: jest.fn(),
    },
    gemini: {
      generateText: jest.fn(),
    },
  };
});

describe('POST /api/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Parameter Validation', () => {
    it('should return 400 if prompt is missing', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'openai',
              model: 'gpt-4-turbo-preview',
              apiKey: 'sk-test',
            }),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBe('Missing required parameters');
        },
      });
    });

    it('should return 400 if provider is missing', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              model: 'gpt-4-turbo-preview',
              apiKey: 'sk-test',
            }),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBe('Missing required parameters');
        },
      });
    });

    it('should return 400 if model is missing', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              provider: 'openai',
              apiKey: 'sk-test',
            }),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBe('Missing required parameters');
        },
      });
    });

    it('should return 400 if apiKey is missing', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              provider: 'openai',
              model: 'gpt-4-turbo-preview',
            }),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBe('Missing required parameters');
        },
      });
    });

    it('should return 400 for invalid provider', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              provider: 'unsupported',
              model: 'some-model',
              apiKey: 'sk-test',
            }),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBe('Invalid provider: unsupported');
        },
      });
    });
  });

  describe('OpenAI Provider', () => {
    it('should successfully generate response for OpenAI', async () => {
      const mockOpenai = providers.openai as jest.Mocked<typeof providers.openai>;
      mockOpenai.generateText = jest.fn().mockResolvedValue({
        content: 'This is a test response from GPT-4',
        tokens: 150,
        latency: 1200,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              provider: 'openai',
              model: 'gpt-4-turbo-preview',
              apiKey: 'sk-test-123',
            }),
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.content).toBe('This is a test response from GPT-4');
          expect(data.tokens).toBe(150);
          expect(data.latency).toBe(1200);
          expect(mockOpenai.generateText).toHaveBeenCalledWith({
            model: 'gpt-4-turbo-preview',
            prompt: 'Test prompt',
            apiKey: 'sk-test-123',
          });
        },
      });
    });

    it('should handle OpenAI API errors', async () => {
      const mockOpenai = providers.openai as jest.Mocked<typeof providers.openai>;
      mockOpenai.generateText = jest.fn().mockRejectedValue(new Error('OpenAI API error'));

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              provider: 'openai',
              model: 'gpt-4-turbo-preview',
              apiKey: 'sk-test-123',
            }),
          });

          expect(response.status).toBe(500);
          const data = await response.json();
          expect(data.error).toBe('OpenAI API error');
        },
      });
    });
  });

  describe('Anthropic Provider', () => {
    it('should successfully generate response for Anthropic', async () => {
      const mockAnthropic = providers.anthropic as jest.Mocked<typeof providers.anthropic>;
      mockAnthropic.generateText = jest.fn().mockResolvedValue({
        content: 'This is a test response from Claude',
        tokens: 150,
        latency: 1500,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              provider: 'anthropic',
              model: 'claude-3-5-sonnet-20241022',
              apiKey: 'sk-ant-test-123',
            }),
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.content).toBe('This is a test response from Claude');
          expect(data.tokens).toBe(150);
          expect(data.latency).toBe(1500);
          expect(mockAnthropic.generateText).toHaveBeenCalledWith({
            model: 'claude-3-5-sonnet-20241022',
            prompt: 'Test prompt',
            apiKey: 'sk-ant-test-123',
          });
        },
      });
    });

    it('should handle Anthropic API errors', async () => {
      const mockAnthropic = providers.anthropic as jest.Mocked<typeof providers.anthropic>;
      mockAnthropic.generateText = jest.fn().mockRejectedValue(new Error('Anthropic API error'));

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              provider: 'anthropic',
              model: 'claude-3-5-sonnet-20241022',
              apiKey: 'sk-ant-test-123',
            }),
          });

          expect(response.status).toBe(500);
          const data = await response.json();
          expect(data.error).toBe('Anthropic API error');
        },
      });
    });
  });

  describe('OpenRouter Provider', () => {
    it('should successfully generate response for OpenRouter', async () => {
      const mockOpenRouter = providers.openrouter as jest.Mocked<typeof providers.openrouter>;
      mockOpenRouter.generateText = jest.fn().mockResolvedValue({
        content: 'This is a test response from OpenRouter',
        tokens: 200,
        latency: 1800,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              provider: 'openrouter',
              model: 'openai/gpt-4-turbo',
              apiKey: 'sk-or-test-123',
            }),
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.content).toBe('This is a test response from OpenRouter');
          expect(data.tokens).toBe(200);
          expect(data.latency).toBe(1800);
          expect(mockOpenRouter.generateText).toHaveBeenCalledWith({
            model: 'openai/gpt-4-turbo',
            prompt: 'Test prompt',
            apiKey: 'sk-or-test-123',
          });
        },
      });
    });
  });

  describe('Gemini Provider', () => {
    it('should successfully generate response for Gemini', async () => {
      const mockGemini = providers.gemini as jest.Mocked<typeof providers.gemini>;
      mockGemini.generateText = jest.fn().mockResolvedValue({
        content: 'This is a test response from Gemini',
        tokens: 180,
        latency: 1400,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              provider: 'gemini',
              model: 'gemini-pro',
              apiKey: 'test-gemini-key',
            }),
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.content).toBe('This is a test response from Gemini');
          expect(data.tokens).toBe(180);
          expect(data.latency).toBe(1400);
          expect(mockGemini.generateText).toHaveBeenCalledWith({
            model: 'gemini-pro',
            prompt: 'Test prompt',
            apiKey: 'test-gemini-key',
          });
        },
      });
    });
  });

  describe('Model Not Available Error', () => {
    it('should handle ModelNotAvailableError from providers', async () => {
      const mockOpenai = providers.openai as jest.Mocked<typeof providers.openai>;
      const ModelNotAvailableError = providers.ModelNotAvailableError;
      mockOpenai.generateText = jest.fn().mockRejectedValue(
        new ModelNotAvailableError('Model gpt-4o is not available through OpenAI API')
      );

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Test prompt',
              provider: 'openai',
              model: 'gpt-4o',
              apiKey: 'sk-test-123',
            }),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBe('Model gpt-4o is not available through OpenAI API');
        },
      });
    });
  });
});
