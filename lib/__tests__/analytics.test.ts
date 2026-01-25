import { trackEvent, AnalyticsEvent, AnalyticsData } from '../analytics';
import * as environment from '../environment';

// Mock the environment module
jest.mock('../environment', () => ({
  isTauriEnvironment: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  describe('trackEvent', () => {
    it('should skip analytics in Tauri environment', async () => {
      (environment.isTauriEnvironment as jest.Mock).mockReturnValue(true);

      await trackEvent('api_key_added', { provider: 'openai' });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should send analytics in web environment', async () => {
      (environment.isTauriEnvironment as jest.Mock).mockReturnValue(false);

      await trackEvent('api_key_added', { provider: 'openai' });

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'api_key_added',
          data: { provider: 'openai' },
        }),
      });
    });

    it('should send event without data', async () => {
      (environment.isTauriEnvironment as jest.Mock).mockReturnValue(false);

      await trackEvent('generation_success');

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'generation_success',
          data: undefined,
        }),
      });
    });

    it('should not throw when fetch fails', async () => {
      (environment.isTauriEnvironment as jest.Mock).mockReturnValue(false);
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(trackEvent('api_key_added')).resolves.not.toThrow();
    });

    it('should support all event types', async () => {
      (environment.isTauriEnvironment as jest.Mock).mockReturnValue(false);

      const events: AnalyticsEvent[] = [
        'api_key_added',
        'api_key_removed',
        'api_key_tested',
        'api_key_test_success',
        'api_key_test_failure',
        'generation_success',
        'generation_error',
      ];

      for (const event of events) {
        await trackEvent(event);
        expect(mockFetch).toHaveBeenCalled();
      }
    });

    it('should include model in analytics data', async () => {
      (environment.isTauriEnvironment as jest.Mock).mockReturnValue(false);

      const data: AnalyticsData = {
        provider: 'anthropic',
        model: 'claude-3-opus',
      };

      await trackEvent('generation_success', data);

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics', expect.objectContaining({
        body: JSON.stringify({
          event: 'generation_success',
          data: { provider: 'anthropic', model: 'claude-3-opus' },
        }),
      }));
    });

    it('should include error_type in analytics data', async () => {
      (environment.isTauriEnvironment as jest.Mock).mockReturnValue(false);

      const data: AnalyticsData = {
        provider: 'openai',
        error_type: 'rate_limit',
      };

      await trackEvent('generation_error', data);

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics', expect.objectContaining({
        body: JSON.stringify({
          event: 'generation_error',
          data: { provider: 'openai', error_type: 'rate_limit' },
        }),
      }));
    });
  });
});
