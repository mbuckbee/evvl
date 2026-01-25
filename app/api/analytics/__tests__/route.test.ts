/**
 * @jest-environment node
 */

import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '../route';

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    incr: jest.fn(),
    set: jest.fn(),
  },
}));

import { kv } from '@vercel/kv';

describe('POST /api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track event successfully', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'api_key_added',
            data: { provider: 'openai' },
          }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      },
    });
  });

  it('should return 400 when event is missing', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { provider: 'openai' },
          }),
        });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Event type is required');
      },
    });
  });

  it('should increment total counter for event', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'generation_success' }),
        });

        expect(kv.incr).toHaveBeenCalledWith('analytics:generation_success:total');
      },
    });
  });

  it('should track by provider when provided', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'api_key_added',
            data: { provider: 'anthropic' },
          }),
        });

        expect(kv.incr).toHaveBeenCalledWith('analytics:api_key_added:provider:anthropic');
      },
    });
  });

  it('should track by model when provided', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'generation_success',
            data: { provider: 'openai', model: 'gpt-4' },
          }),
        });

        expect(kv.incr).toHaveBeenCalledWith('analytics:generation_success:model:gpt-4');
      },
    });
  });

  it('should track error types for generation_error', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'generation_error',
            data: { provider: 'openai', error_type: 'rate_limit' },
          }),
        });

        expect(kv.incr).toHaveBeenCalledWith('analytics:generation_error:type:rate_limit');
      },
    });
  });

  it('should set last occurrence timestamp', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'api_key_tested' }),
        });

        expect(kv.set).toHaveBeenCalledWith(
          'analytics:api_key_tested:last',
          expect.any(String)
        );
      },
    });
  });

  it('should succeed even if KV fails', async () => {
    (kv.incr as jest.Mock).mockRejectedValue(new Error('KV error'));

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'api_key_added' }),
        });
        const data = await response.json();

        // Should still succeed - just logs to console
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      },
    });
  });
});
