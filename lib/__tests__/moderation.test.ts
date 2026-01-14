/**
 * Moderation Module Tests
 *
 * Tests for the OpenAI Moderation API wrapper
 */

import { checkModeration, checkContentForSharing } from '../moderation';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Moderation Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkModeration', () => {
    it('should return passed=true for empty content', async () => {
      const result = await checkModeration('');
      expect(result.passed).toBe(true);
      expect(result.flaggedCategories).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return passed=true for whitespace-only content', async () => {
      const result = await checkModeration('   \n\t  ');
      expect(result.passed).toBe(true);
      expect(result.flaggedCategories).toEqual([]);
    });

    it('should return passed=true when content is not flagged', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'modr-123',
          model: 'omni-moderation-latest',
          results: [{
            flagged: false,
            categories: {
              hate: false,
              'hate/threatening': false,
              harassment: false,
              'harassment/threatening': false,
              'self-harm': false,
              'self-harm/intent': false,
              'self-harm/instructions': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false,
            },
            category_scores: {},
          }],
        }),
      });

      const result = await checkModeration('Hello, this is a friendly message');

      expect(result.passed).toBe(true);
      expect(result.flaggedCategories).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return passed=false with flagged categories when content is flagged', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'modr-123',
          model: 'omni-moderation-latest',
          results: [{
            flagged: true,
            categories: {
              hate: true,
              'hate/threatening': false,
              harassment: true,
              'harassment/threatening': false,
              'self-harm': false,
              'self-harm/intent': false,
              'self-harm/instructions': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false,
            },
            category_scores: {},
          }],
        }),
      });

      const result = await checkModeration('Some inappropriate content');

      expect(result.passed).toBe(false);
      expect(result.flaggedCategories).toContain('hate');
      expect(result.flaggedCategories).toContain('harassment');
      expect(result.flaggedCategories).toHaveLength(2);
    });

    it('should return passed=true with error when API returns non-ok status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const result = await checkModeration('Test content');

      expect(result.passed).toBe(true);
      expect(result.flaggedCategories).toEqual([]);
      expect(result.error).toBe('Moderation check unavailable');
    });

    it('should return passed=true with error when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkModeration('Test content');

      expect(result.passed).toBe(true);
      expect(result.flaggedCategories).toEqual([]);
      expect(result.error).toBe('Moderation check failed');
    });
  });

  describe('checkContentForSharing', () => {
    it('should combine prompt and responses for moderation check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'modr-123',
          model: 'omni-moderation-latest',
          results: [{
            flagged: false,
            categories: {
              hate: false,
              'hate/threatening': false,
              harassment: false,
              'harassment/threatening': false,
              'self-harm': false,
              'self-harm/intent': false,
              'self-harm/instructions': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false,
            },
            category_scores: {},
          }],
        }),
      });

      const result = await checkContentForSharing(
        'User prompt',
        'System prompt',
        ['Response 1', 'Response 2']
      );

      expect(result.passed).toBe(true);

      // Verify the combined content was sent
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.input).toContain('User prompt');
      expect(callBody.input).toContain('System prompt');
      expect(callBody.input).toContain('Response 1');
      expect(callBody.input).toContain('Response 2');
    });

    it('should work without system prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'modr-123',
          model: 'omni-moderation-latest',
          results: [{
            flagged: false,
            categories: {},
            category_scores: {},
          }],
        }),
      });

      const result = await checkContentForSharing('User prompt', undefined, ['Response']);
      expect(result.passed).toBe(true);
    });

    it('should work without responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'modr-123',
          model: 'omni-moderation-latest',
          results: [{
            flagged: false,
            categories: {},
            category_scores: {},
          }],
        }),
      });

      const result = await checkContentForSharing('User prompt');
      expect(result.passed).toBe(true);
    });
  });
});
