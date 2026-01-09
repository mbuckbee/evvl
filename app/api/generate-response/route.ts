import { NextRequest, NextResponse } from 'next/server';
import { transformModelSlug } from '@/lib/model-transformer';
import { openai, ModelNotAvailableError } from '@/lib/providers';

/**
 * Generate response using OpenAI's Responses API
 *
 * This endpoint is used for models that require the Responses API (/v1/responses)
 * instead of the Chat Completions API (/v1/chat/completions).
 *
 * Key differences:
 * - Server-side state management (store: true for persistent context)
 * - Built-in tools (web search, file search, code interpreter)
 * - Better performance for reasoning models (3-5% improvement)
 * - Lower costs (40-80% better cache utilization)
 *
 * For validation purposes, we use basic stateless requests without tools.
 */

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

    // Only OpenAI supports Responses API
    if (provider !== 'openai') {
      return NextResponse.json(
        { error: 'Responses API is only supported for OpenAI provider' },
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
    console.log(`[RESPONSES_API_REQUEST] provider=${provider} model=${transformedModel}`);

    try {
      // Call OpenAI's Responses API
      const result = await openai.generateResponse({
        model: transformedModel,
        prompt,
        apiKey,
      });

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

      // Handle provider-specific errors
      console.error(`[RESPONSES_API_ERROR] provider=${provider} model=${transformedModel}`, sanitizeError(providerError));

      // Return the actual error message from the API instead of making assumptions
      const errorMessage = providerError.message ||
                          providerError.error?.message ||
                          'Failed to generate response';

      return NextResponse.json(
        { error: errorMessage },
        { status: providerError.status || 400 }
      );
    }
  } catch (error: any) {
    console.error('Responses API error:', sanitizeError(error));

    // Return the actual error message without modification
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: error.status || 500 }
    );
  }
}
