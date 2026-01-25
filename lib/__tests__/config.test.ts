import {
  PROVIDERS,
  getProvider,
  getProviderKeys,
  getModelsForProvider,
  getDefaultModel,
  getTestModel,
  isLocalProvider,
  getDefaultEndpoint,
  ProviderKey,
} from '../config';

describe('Config', () => {
  describe('PROVIDERS', () => {
    it('should have all expected providers', () => {
      const keys = PROVIDERS.map(p => p.key);
      expect(keys).toContain('openai');
      expect(keys).toContain('anthropic');
      expect(keys).toContain('openrouter');
      expect(keys).toContain('gemini');
      expect(keys).toContain('ollama');
      expect(keys).toContain('lmstudio');
    });

    it('should have required fields for each provider', () => {
      PROVIDERS.forEach(provider => {
        expect(provider.key).toBeDefined();
        expect(provider.name).toBeDefined();
        expect(provider.logo).toBeDefined();
        expect(provider.settingsUrl).toBeDefined();
        expect(Array.isArray(provider.models)).toBe(true);
      });
    });
  });

  describe('getProvider', () => {
    it('should return provider config for valid key', () => {
      const openai = getProvider('openai');
      expect(openai).toBeDefined();
      expect(openai?.key).toBe('openai');
      expect(openai?.name).toBe('ChatGPT');
    });

    it('should return undefined for invalid key', () => {
      const invalid = getProvider('invalid' as ProviderKey);
      expect(invalid).toBeUndefined();
    });

    it('should return correct config for each provider', () => {
      expect(getProvider('anthropic')?.name).toBe('Claude');
      expect(getProvider('openrouter')?.name).toBe('OpenRouter');
      expect(getProvider('gemini')?.name).toBe('Gemini');
      expect(getProvider('ollama')?.name).toBe('Ollama');
      expect(getProvider('lmstudio')?.name).toBe('LM Studio');
    });
  });

  describe('getProviderKeys', () => {
    it('should return all provider keys', () => {
      const keys = getProviderKeys();
      expect(keys).toHaveLength(6);
      expect(keys).toContain('openai');
      expect(keys).toContain('anthropic');
      expect(keys).toContain('openrouter');
      expect(keys).toContain('gemini');
      expect(keys).toContain('ollama');
      expect(keys).toContain('lmstudio');
    });
  });

  describe('getModelsForProvider', () => {
    it('should return empty array for providers with no models loaded', () => {
      // Models are populated dynamically, so they start empty
      const models = getModelsForProvider('openai');
      expect(Array.isArray(models)).toBe(true);
    });

    it('should return empty array for invalid provider', () => {
      const models = getModelsForProvider('invalid' as ProviderKey);
      expect(models).toEqual([]);
    });
  });

  describe('getDefaultModel', () => {
    it('should return empty string when no models are loaded', () => {
      // Models are populated dynamically
      const model = getDefaultModel('openai');
      expect(model).toBe('');
    });
  });

  describe('getTestModel', () => {
    it('should return test model for openai', () => {
      const testModel = getTestModel('openai');
      expect(testModel).toBe('gpt-3.5-turbo');
    });

    it('should return test model for anthropic', () => {
      const testModel = getTestModel('anthropic');
      expect(testModel).toBe('claude-3-haiku-20240307');
    });

    it('should return test model for openrouter', () => {
      const testModel = getTestModel('openrouter');
      expect(testModel).toBe('openai/gpt-3.5-turbo');
    });

    it('should return test model for gemini', () => {
      const testModel = getTestModel('gemini');
      expect(testModel).toBe('gemini-2.0-flash-exp');
    });

    it('should return empty string for local providers without test model', () => {
      // Ollama and LM Studio don't have test models (they use local models)
      const ollamaTest = getTestModel('ollama');
      const lmstudioTest = getTestModel('lmstudio');
      // They fallback to getDefaultModel which returns '' when no models loaded
      expect(ollamaTest).toBe('');
      expect(lmstudioTest).toBe('');
    });
  });

  describe('isLocalProvider', () => {
    it('should return true for ollama', () => {
      expect(isLocalProvider('ollama')).toBe(true);
    });

    it('should return true for lmstudio', () => {
      expect(isLocalProvider('lmstudio')).toBe(true);
    });

    it('should return false for cloud providers', () => {
      expect(isLocalProvider('openai')).toBe(false);
      expect(isLocalProvider('anthropic')).toBe(false);
      expect(isLocalProvider('openrouter')).toBe(false);
      expect(isLocalProvider('gemini')).toBe(false);
    });
  });

  describe('getDefaultEndpoint', () => {
    it('should return localhost endpoint for ollama', () => {
      expect(getDefaultEndpoint('ollama')).toBe('http://localhost:11434');
    });

    it('should return localhost endpoint for lmstudio', () => {
      expect(getDefaultEndpoint('lmstudio')).toBe('http://localhost:1234');
    });

    it('should return empty string for cloud providers', () => {
      expect(getDefaultEndpoint('openai')).toBe('');
      expect(getDefaultEndpoint('anthropic')).toBe('');
      expect(getDefaultEndpoint('openrouter')).toBe('');
      expect(getDefaultEndpoint('gemini')).toBe('');
    });
  });
});
