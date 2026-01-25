/**
 * @jest-environment node
 */

import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '../route';

describe('GET /api/api-keys-status', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return all false when no keys are set', async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: 'GET' });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          openai: false,
          anthropic: false,
          gemini: false,
          openrouter: false,
        });
      },
    });
  });

  it('should return true for configured keys', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.ANTHROPIC_API_KEY = 'ant-test';
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: 'GET' });
        const data = await response.json();

        expect(data).toEqual({
          openai: true,
          anthropic: true,
          gemini: false,
          openrouter: false,
        });
      },
    });
  });

  it('should return true for all configured keys', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.ANTHROPIC_API_KEY = 'ant-test';
    process.env.GEMINI_API_KEY = 'gemini-test';
    process.env.OPENROUTER_API_KEY = 'or-test';

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: 'GET' });
        const data = await response.json();

        expect(data).toEqual({
          openai: true,
          anthropic: true,
          gemini: true,
          openrouter: true,
        });
      },
    });
  });

  it('should not expose actual key values', async () => {
    process.env.OPENAI_API_KEY = 'sk-secret-key-12345';

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: 'GET' });
        const data = await response.json();

        expect(data.openai).toBe(true);
        expect(JSON.stringify(data)).not.toContain('sk-secret-key-12345');
      },
    });
  });
});
