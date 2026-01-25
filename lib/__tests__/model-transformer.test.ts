import { transformModelSlug } from '../model-transformer';

describe('Model Transformer', () => {
  describe('transformModelSlug', () => {
    // =========================================================================
    // OpenRouter (pass-through)
    // =========================================================================
    describe('OpenRouter', () => {
      it('should pass through OpenRouter models unchanged', () => {
        expect(transformModelSlug('openrouter', 'openai/gpt-4')).toBe('openai/gpt-4');
        expect(transformModelSlug('openrouter', 'anthropic/claude-3-opus')).toBe('anthropic/claude-3-opus');
        expect(transformModelSlug('openrouter', 'google/gemini-pro')).toBe('google/gemini-pro');
      });
    });

    // =========================================================================
    // Local Providers (pass-through)
    // =========================================================================
    describe('Local Providers', () => {
      it('should pass through Ollama models unchanged', () => {
        expect(transformModelSlug('ollama', 'llama2')).toBe('llama2');
        expect(transformModelSlug('ollama', 'codellama:7b')).toBe('codellama:7b');
        expect(transformModelSlug('ollama', 'mistral')).toBe('mistral');
      });

      it('should pass through LM Studio models unchanged', () => {
        expect(transformModelSlug('lmstudio', 'local-model')).toBe('local-model');
        expect(transformModelSlug('lmstudio', 'TheBloke/Llama-2-7B-GGUF')).toBe('TheBloke/Llama-2-7B-GGUF');
      });
    });

    // =========================================================================
    // OpenAI
    // =========================================================================
    describe('OpenAI', () => {
      it('should strip openai/ prefix for standard models', () => {
        expect(transformModelSlug('openai', 'openai/gpt-4')).toBe('gpt-4');
        expect(transformModelSlug('openai', 'openai/gpt-4-turbo')).toBe('gpt-4-turbo');
        expect(transformModelSlug('openai', 'openai/gpt-3.5-turbo')).toBe('gpt-3.5-turbo');
        expect(transformModelSlug('openai', 'openai/gpt-4o')).toBe('gpt-4o');
        expect(transformModelSlug('openai', 'openai/gpt-4o-mini')).toBe('gpt-4o-mini');
      });

      it('should handle GPT-5 image models with name mapping', () => {
        expect(transformModelSlug('openai', 'openai/gpt-5-image')).toBe('gpt-image-1');
        expect(transformModelSlug('openai', 'openai/gpt-5-image-mini')).toBe('gpt-image-1-mini');
        expect(transformModelSlug('openai', 'gpt-5-image')).toBe('gpt-image-1');
        expect(transformModelSlug('openai', 'gpt-5-image-mini')).toBe('gpt-image-1-mini');
      });

      it('should handle GPT-5 chat with -latest suffix', () => {
        expect(transformModelSlug('openai', 'openai/gpt-5-chat')).toBe('gpt-5-chat-latest');
        expect(transformModelSlug('openai', 'gpt-5-chat')).toBe('gpt-5-chat-latest');
      });

      it('should pass through models without prefix', () => {
        expect(transformModelSlug('openai', 'gpt-4')).toBe('gpt-4');
        expect(transformModelSlug('openai', 'gpt-3.5-turbo')).toBe('gpt-3.5-turbo');
      });
    });

    // =========================================================================
    // Gemini
    // =========================================================================
    describe('Gemini', () => {
      it('should strip google/ prefix for standard models', () => {
        expect(transformModelSlug('gemini', 'google/gemini-pro')).toBe('gemini-pro');
        expect(transformModelSlug('gemini', 'google/gemini-1.5-pro')).toBe('gemini-1.5-pro');
        expect(transformModelSlug('gemini', 'google/gemini-1.5-flash')).toBe('gemini-1.5-flash');
      });

      it('should handle gemini-flash-2.0-exp word order mapping', () => {
        expect(transformModelSlug('gemini', 'google/gemini-flash-2.0-exp')).toBe('gemini-2.0-flash-exp');
      });

      it('should handle dotted to dashed version mapping', () => {
        expect(transformModelSlug('gemini', 'google/gemini-3.0-pro')).toBe('gemini-3-pro');
        expect(transformModelSlug('gemini', 'google/gemini-3.0-flash')).toBe('gemini-3-flash');
      });

      it('should handle image preview suffix mapping', () => {
        expect(transformModelSlug('gemini', 'google/gemini-3-pro-image')).toBe('gemini-3-pro-image-preview');
      });

      it('should handle preview version mapping', () => {
        expect(transformModelSlug('gemini', 'google/gemini-2.5-pro-preview')).toBe('gemini-2.5-pro');
      });

      it('should pass through models without prefix', () => {
        expect(transformModelSlug('gemini', 'gemini-pro')).toBe('gemini-pro');
        expect(transformModelSlug('gemini', 'gemini-2.0-flash-exp')).toBe('gemini-2.0-flash-exp');
      });
    });

    // =========================================================================
    // Anthropic
    // =========================================================================
    describe('Anthropic', () => {
      it('should map Claude 4.5 series models', () => {
        expect(transformModelSlug('anthropic', 'anthropic/claude-opus-4-5')).toBe('claude-opus-4-5-20251101');
        expect(transformModelSlug('anthropic', 'anthropic/claude-sonnet-4-5')).toBe('claude-sonnet-4-5-20250929');
        expect(transformModelSlug('anthropic', 'anthropic/claude-haiku-4-5')).toBe('claude-haiku-4-5-20251001');
      });

      it('should handle dot notation for Claude 4.5', () => {
        expect(transformModelSlug('anthropic', 'anthropic/claude-opus-4.5')).toBe('claude-opus-4-5-20251101');
        expect(transformModelSlug('anthropic', 'anthropic/claude-sonnet-4.5')).toBe('claude-sonnet-4-5-20250929');
        expect(transformModelSlug('anthropic', 'anthropic/claude-haiku-4.5')).toBe('claude-haiku-4-5-20251001');
      });

      it('should pass through already-dated Claude 4.5 models', () => {
        expect(transformModelSlug('anthropic', 'anthropic/claude-opus-4-5-20251101')).toBe('claude-opus-4-5-20251101');
        expect(transformModelSlug('anthropic', 'anthropic/claude-sonnet-4-5-20250929')).toBe('claude-sonnet-4-5-20250929');
      });

      it('should map Claude 4.x models', () => {
        expect(transformModelSlug('anthropic', 'anthropic/claude-opus-4')).toBe('claude-opus-4-20250514');
        expect(transformModelSlug('anthropic', 'anthropic/claude-opus-4-1')).toBe('claude-opus-4-1-20250805');
        expect(transformModelSlug('anthropic', 'anthropic/claude-sonnet-4')).toBe('claude-sonnet-4-20250514');
      });

      it('should map Claude 3 series models', () => {
        expect(transformModelSlug('anthropic', 'anthropic/claude-3-haiku')).toBe('claude-3-haiku-20240307');
        expect(transformModelSlug('anthropic', 'anthropic/claude-3-haiku-20240307')).toBe('claude-3-haiku-20240307');
      });

      it('should map deprecated but working models', () => {
        expect(transformModelSlug('anthropic', 'anthropic/claude-3-opus')).toBe('claude-3-opus-20240229');
        expect(transformModelSlug('anthropic', 'anthropic/claude-3.5-haiku')).toBe('claude-3-5-haiku-20241022');
        expect(transformModelSlug('anthropic', 'anthropic/claude-3.7-sonnet')).toBe('claude-3-7-sonnet-20250219');
      });

      it('should strip prefix for already-dated models', () => {
        expect(transformModelSlug('anthropic', 'anthropic/claude-3-opus-20240229')).toBe('claude-3-opus-20240229');
      });

      it('should throw for unknown Anthropic models', () => {
        expect(() => transformModelSlug('anthropic', 'anthropic/claude-unknown'))
          .toThrow('Unknown Anthropic model');
        expect(() => transformModelSlug('anthropic', 'anthropic/claude-99'))
          .toThrow('Unknown Anthropic model');
      });
    });
  });
});
