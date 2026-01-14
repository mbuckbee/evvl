/**
 * Share API Route Tests
 *
 * Tests for the /api/share endpoint
 *
 * @jest-environment node
 */

import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '../route';

// Mock share storage
jest.mock('@/lib/share-storage', () => ({
  generateShareId: jest.fn(() => 'test123456'),
  getExpiryTimestamp: jest.fn(() => Date.now() + 7 * 24 * 60 * 60 * 1000),
  checkRateLimit: jest.fn(() => Promise.resolve({ allowed: true, remaining: 4 })),
  incrementRateLimit: jest.fn(() => Promise.resolve()),
  saveShare: jest.fn(() => Promise.resolve('https://blob.vercel-storage.com/shares/test123456.json')),
  getClientIP: jest.fn(() => '192.168.1.1'),
}));

// Mock moderation
jest.mock('@/lib/moderation', () => ({
  checkContentForSharing: jest.fn(() => Promise.resolve({ passed: true, flaggedCategories: [] })),
}));

// Mock Vercel KV for analytics tracking
jest.mock('@vercel/kv', () => ({
  kv: {
    incr: jest.fn(() => Promise.resolve(1)),
    set: jest.fn(() => Promise.resolve('OK')),
  },
}));

import * as shareStorage from '@/lib/share-storage';
import * as moderation from '@/lib/moderation';

describe('POST /api/share', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validRequest = {
    prompt: {
      name: 'Test Prompt',
      content: 'Hello, this is a test prompt',
      systemPrompt: 'You are helpful',
    },
    responses: [
      {
        provider: 'openai',
        model: 'gpt-4',
        modelName: 'GPT-4',
        type: 'text',
        content: 'This is a test response',
        latency: 1000,
        tokens: 50,
      },
    ],
  };

  describe('Request Validation', () => {
    it('should return 400 if prompt is missing', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              responses: validRequest.responses,
            }),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.code).toBe('INVALID_REQUEST');
        },
      });
    });

    it('should return 400 if prompt content is missing', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: { name: 'Test' },
              responses: validRequest.responses,
            }),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.code).toBe('INVALID_REQUEST');
        },
      });
    });

    it('should return 400 if responses are missing', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: validRequest.prompt,
            }),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.code).toBe('INVALID_REQUEST');
        },
      });
    });

    it('should return 400 if responses array is empty', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: validRequest.prompt,
              responses: [],
            }),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.code).toBe('INVALID_REQUEST');
        },
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limited', async () => {
      (shareStorage.checkRateLimit as jest.Mock).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validRequest),
          });

          expect(response.status).toBe(429);
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.code).toBe('RATE_LIMITED');
        },
      });
    });
  });

  describe('Content Moderation', () => {
    it('should return 400 when content is flagged', async () => {
      (moderation.checkContentForSharing as jest.Mock).mockResolvedValueOnce({
        passed: false,
        flaggedCategories: ['hate', 'violence'],
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validRequest),
          });

          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.code).toBe('MODERATION_FAILED');
          expect(data.error).toContain('hate');
          expect(data.error).toContain('violence');
        },
      });
    });
  });

  describe('Successful Share Creation', () => {
    it('should create a share and return URL', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validRequest),
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.success).toBe(true);
          expect(data.shareId).toBe('test123456');
          expect(data.shareUrl).toContain('/s/test123456');
          expect(data.expiresAt).toBeGreaterThan(Date.now());
        },
      });
    });

    it('should call saveShare with correct data', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validRequest),
          });

          expect(shareStorage.saveShare).toHaveBeenCalledTimes(1);
          const savedShare = (shareStorage.saveShare as jest.Mock).mock.calls[0][0];
          expect(savedShare.id).toBe('test123456');
          expect(savedShare.prompt.name).toBe('Test Prompt');
          expect(savedShare.prompt.content).toBe('Hello, this is a test prompt');
          expect(savedShare.responses).toHaveLength(1);
        },
      });
    });

    it('should increment rate limit after successful share', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validRequest),
          });

          expect(shareStorage.incrementRateLimit).toHaveBeenCalledWith('192.168.1.1');
        },
      });
    });
  });
});
