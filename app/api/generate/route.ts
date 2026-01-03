import { NextRequest, NextResponse } from 'next/server';
import { transformModelSlug } from '@/lib/model-transformer';
import { openai, anthropic, openrouter, gemini, ModelNotAvailableError } from '@/lib/providers';

// Sanitize error objects to remove API keys before logging
function sanitizeError(error: any): any {
  if (!error) return error;

  const sanitized = { ...error };

  // Remove common API key fields
  if (sanitized.config?.headers?.['x-api-key']) {
    sanitized.config.headers['x-api-key'] = '[REDACTED]';
  }
  if (sanitized.config?.headers?.['Authorization']) {
    sanitized.config.headers['Authorization'] = '[REDACTED]';
  }
  if (sanitized.apiKey) {
    sanitized.apiKey = '[REDACTED]';
  }

  return sanitized;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, provider, model, apiKey } = await req.json();

    if (!prompt || !provider || !model || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ['openai', 'anthropic', 'openrouter', 'gemini'];
    if (!validProviders.includes(provider)) {
      console.error(`[INVALID_PROVIDER] received provider=${provider}`);
      return NextResponse.json(
        { error: `Invalid provider: ${provider}` },
        { status: 400 }
      );
    }

    // Validate model is not empty/null
    if (typeof model !== 'string' || model.trim().length === 0) {
      console.error(`[INVALID_MODEL] provider=${provider} model="${model}"`);
      return NextResponse.json(
        { error: 'Model must be a non-empty string' },
        { status: 400 }
      );
    }

    // Transform model slug for direct API calls
    const transformedModel = transformModelSlug(provider, model);

    // Log transformation for debugging and monitoring
    if (model !== transformedModel) {
      console.log(`[MODEL_TRANSFORM] ${provider}: ${model} → ${transformedModel}`);
    }

    // Log all API requests for monitoring
    console.log(`[API_REQUEST] provider=${provider} model=${transformedModel}`);

    try {
      let result;

      // Call the appropriate provider
      if (provider === 'openai') {
        result = await openai.generateText({
          model: transformedModel,
          prompt,
          apiKey,
        });
      } else if (provider === 'openrouter') {
        result = await openrouter.generateText({
          model: transformedModel,
          prompt,
          apiKey,
        });
      } else if (provider === 'anthropic') {
        result = await anthropic.generateText({
          model: transformedModel,
          prompt,
          apiKey,
        });
      } else if (provider === 'gemini') {
        result = await gemini.generateText({
          model: transformedModel,
          prompt,
          apiKey,
        });
      } else {
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
      }

      return NextResponse.json(result);
    } catch (providerError: any) {
      // Handle ModelNotAvailableError from providers
      if (providerError instanceof ModelNotAvailableError) {
        console.error(`[MODEL_NOT_AVAILABLE] provider=${provider} model=${transformedModel}`, providerError.message);
        return NextResponse.json(
          { error: providerError.message },
          { status: 400 }
        );
      }

      // Handle provider-specific errors (model not found, etc.)
      console.error(`[MODEL_ERROR] provider=${provider} model=${transformedModel}`, sanitizeError(providerError));

      // Model not found errors - check status code AND error message/type to be specific
      const isModelNotFound = (
        // OpenAI SDK: 404 with specific message about model
        (providerError.status === 404 && (
          providerError.message?.toLowerCase().includes('model') ||
          providerError.message?.includes('does not exist') ||
          providerError.message?.includes('do not have access')
        )) ||
        // Explicit model_not_found code
        providerError.code === 'model_not_found' ||
        // Anthropic: not_found_error type
        providerError.type === 'not_found_error'
      );

      if (isModelNotFound) {
        const providerName = provider === 'openai' ? 'OpenAI' :
                            provider === 'anthropic' ? 'Anthropic' :
                            provider.charAt(0).toUpperCase() + provider.slice(1);

        console.error(`[MODEL_NOT_FOUND] provider=${provider} model=${transformedModel}`);

        return NextResponse.json(
          { error: `This model is not available through ${providerName}'s direct API. Try using the OpenRouter provider instead.` },
          { status: 400 }
        );
      }

      // Re-throw other errors to be caught by outer catch
      throw providerError;
    }
  } catch (error: any) {
    console.error('Generation error:', sanitizeError(error));

    // Enhanced error handling for unknown models (from transformer)
    if (error.message?.includes('Unknown') && error.message?.includes('model')) {
      return NextResponse.json(
        { error: `Model not supported: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
