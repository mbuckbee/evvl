/**
 * @jest-environment node
 */

import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '../route';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('GET /api/models', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return models from OpenRouter', async () => {
    const mockModels = [
      { id: 'openai/gpt-4', name: 'GPT-4' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockModels }),
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: 'GET' });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.models).toEqual(mockModels);
        expect(data.totalModels).toBe(2);
        expect(data.cached).toBe(true);
      },
    });
  });

  it('should return 500 on OpenRouter API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Service Unavailable',
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: 'GET' });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch models from OpenRouter');
      },
    });
  });

  it('should return 500 on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: 'GET' });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch models from OpenRouter');
      },
    });
  });
});
