/**
 * Tests for API Client routing
 *
 * Tests verify that:
 * 1. API client routes to proxy implementation in web environment
 * 2. API client routes to direct implementation in Tauri environment
 * 3. Both generateText and generateImage route correctly
 */

// Mock the dynamic import for direct API
const mockDirectApi = {
  generateText: jest.fn(),
  generateImage: jest.fn(),
};

jest.mock('../../environment');
jest.mock('../proxy');
jest.mock('../direct', () => mockDirectApi);

describe('API Client Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Web Environment', () => {
    it('should route generateText to proxy API in web environment', async () => {
      await jest.isolateModulesAsync(async () => {
        const environment = await import('../../environment');
        const proxyApi = await import('../proxy');

        (environment.getRuntimeEnvironment as jest.Mock).mockReturnValue('web');

        const mockResponse = {
          content: 'Test response',
          latency: 100,
        };
        (proxyApi.generateText as jest.Mock).mockResolvedValue(mockResponse);

        const { apiClient } = await import('../client');

        const request = {
          apiKey: 'sk-test',
          provider: 'openai' as const,
          model: 'gpt-4',
          prompt: 'Test prompt',
        };

        const result = await apiClient.generateText(request);

        expect(proxyApi.generateText).toHaveBeenCalledWith(request);
        expect(result).toEqual(mockResponse);
      });
    });

    it('should route generateImage to proxy API in web environment', async () => {
      await jest.isolateModulesAsync(async () => {
        const environment = await import('../../environment');
        const proxyApi = await import('../proxy');

        (environment.getRuntimeEnvironment as jest.Mock).mockReturnValue('web');

        const mockResponse = {
          imageUrl: 'https://example.com/image.jpg',
          revisedPrompt: 'Test prompt',
          latency: 100,
        };
        (proxyApi.generateImage as jest.Mock).mockResolvedValue(mockResponse);

        const { apiClient } = await import('../client');

        const request = {
          apiKey: 'sk-test',
          provider: 'openai' as const,
          model: 'dall-e-3',
          prompt: 'Generate an image',
        };

        const result = await apiClient.generateImage(request);

        expect(proxyApi.generateImage).toHaveBeenCalledWith(request);
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Tauri Environment', () => {
    it('should route generateText to direct API in Tauri environment', async () => {
      await jest.isolateModulesAsync(async () => {
        const environment = await import('../../environment');
        (environment.getRuntimeEnvironment as jest.Mock).mockReturnValue('tauri');

        const mockResponse = {
          content: 'Test response',
          latency: 100,
        };
        mockDirectApi.generateText.mockResolvedValue(mockResponse);

        const { apiClient } = await import('../client');

        const request = {
          apiKey: 'sk-test',
          provider: 'openai' as const,
          model: 'gpt-4',
          prompt: 'Test prompt',
        };

        const result = await apiClient.generateText(request);

        expect(mockDirectApi.generateText).toHaveBeenCalledWith(request);
        expect(result).toEqual(mockResponse);
      });
    });

    it('should route generateImage to direct API in Tauri environment', async () => {
      await jest.isolateModulesAsync(async () => {
        const environment = await import('../../environment');
        (environment.getRuntimeEnvironment as jest.Mock).mockReturnValue('tauri');

        const mockResponse = {
          imageUrl: 'https://example.com/image.jpg',
          revisedPrompt: 'Test prompt',
          latency: 100,
        };
        mockDirectApi.generateImage.mockResolvedValue(mockResponse);

        const { apiClient } = await import('../client');

        const request = {
          apiKey: 'sk-test',
          provider: 'openai' as const,
          model: 'dall-e-3',
          prompt: 'Generate an image',
        };

        const result = await apiClient.generateImage(request);

        expect(mockDirectApi.generateImage).toHaveBeenCalledWith(request);
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from proxy API', async () => {
      await jest.isolateModulesAsync(async () => {
        const environment = await import('../../environment');
        const proxyApi = await import('../proxy');

        (environment.getRuntimeEnvironment as jest.Mock).mockReturnValue('web');

        const mockError = { error: 'API Error: Rate limit exceeded' };
        (proxyApi.generateText as jest.Mock).mockResolvedValue(mockError);

        const { apiClient } = await import('../client');

        const request = {
          apiKey: 'sk-test',
          provider: 'openai' as const,
          model: 'gpt-4',
          prompt: 'Test prompt',
        };

        const result = await apiClient.generateText(request);

        expect(result).toEqual(mockError);
      });
    });

    it('should propagate errors from direct API', async () => {
      await jest.isolateModulesAsync(async () => {
        const environment = await import('../../environment');
        (environment.getRuntimeEnvironment as jest.Mock).mockReturnValue('tauri');

        const mockError = { error: 'API Error: Invalid API key' };
        mockDirectApi.generateText.mockResolvedValue(mockError);

        const { apiClient } = await import('../client');

        const request = {
          apiKey: 'sk-invalid',
          provider: 'openai' as const,
          model: 'gpt-4',
          prompt: 'Test prompt',
        };

        const result = await apiClient.generateText(request);

        expect(result).toEqual(mockError);
      });
    });
  });

  describe('Environment Detection', () => {
    it('should detect environment on client instantiation', async () => {
      await jest.isolateModulesAsync(async () => {
        const environment = await import('../../environment');
        (environment.getRuntimeEnvironment as jest.Mock).mockReturnValue('web');

        await import('../client');

        expect(environment.getRuntimeEnvironment).toHaveBeenCalled();
      });
    });

    it('should use the same environment for multiple calls', async () => {
      await jest.isolateModulesAsync(async () => {
        const environment = await import('../../environment');
        const proxyApi = await import('../proxy');

        (environment.getRuntimeEnvironment as jest.Mock).mockReturnValue('web');
        (proxyApi.generateText as jest.Mock).mockResolvedValue({
          content: 'Response',
          latency: 100,
        });

        const { apiClient } = await import('../client');

        const request = {
          apiKey: 'sk-test',
          provider: 'openai' as const,
          model: 'gpt-4',
          prompt: 'Test prompt',
        };

        await apiClient.generateText(request);
        await apiClient.generateText(request);

        // getRuntimeEnvironment should only be called once during instantiation
        expect(environment.getRuntimeEnvironment).toHaveBeenCalledTimes(1);
      });
    });
  });
});
