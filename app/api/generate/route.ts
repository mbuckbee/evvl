import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { transformModelSlug } from '@/lib/model-transformer';

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

    const startTime = Date.now();

    try {
      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
          model: transformedModel,
          messages: [{ role: 'user', content: prompt }],
        });

        const latency = Date.now() - startTime;
        const content = completion.choices[0]?.message?.content || '';
        const tokens = completion.usage?.total_tokens || 0;

        return NextResponse.json({
          content,
          tokens,
          latency,
        });
      } else if (provider === 'openrouter') {
        const openai = new OpenAI({
          apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
        });

        const completion = await openai.chat.completions.create({
          model: transformedModel,
          messages: [{ role: 'user', content: prompt }],
        });

        const latency = Date.now() - startTime;
        const content = completion.choices[0]?.message?.content || '';
        const tokens = completion.usage?.total_tokens || 0;

        return NextResponse.json({
          content,
          tokens,
          latency,
        });
      } else if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: transformedModel,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Anthropic API error response:', JSON.stringify(sanitizeError(error), null, 2));

          // Check if it's a model not found error
          if (response.status === 404 ||
              error.error?.type === 'not_found_error' ||
              error.error?.message?.includes('model') ||
              error.type === 'not_found_error') {
            return NextResponse.json(
              { error: `This model is not available through Anthropic's direct API. Try using the OpenRouter provider instead.` },
              { status: 400 }
            );
          }

          throw new Error(error.error?.message || error.message || JSON.stringify(error) || 'Anthropic API request failed');
        }

        const data = await response.json();
        const latency = Date.now() - startTime;
        const content = data.content[0]?.type === 'text' ? data.content[0].text : '';
        const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

        return NextResponse.json({
          content,
          tokens,
          latency,
        });
      } else if (provider === 'gemini') {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: transformedModel });

        const result = await model.generateContent(prompt);
        const response = result.response;
        const content = response.text();

        const latency = Date.now() - startTime;

        // Gemini doesn't provide token counts in the same way, approximate based on content
        const tokens = Math.ceil((prompt.length + content.length) / 4);

        return NextResponse.json({
          content,
          tokens,
          latency,
        });
      } else {
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
      }
    } catch (providerError: any) {
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
