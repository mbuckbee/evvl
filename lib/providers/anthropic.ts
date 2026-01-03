/**
 * Anthropic provider implementation
 *
 * Handles text generation using Anthropic's Claude API
 */

export interface AnthropicTextRequest {
  model: string;
  prompt: string;
  apiKey: string;
}

export interface AnthropicTextResponse {
  content: string;
  tokens: number;
  latency: number;
}

/**
 * Error class for model not available errors
 */
export class ModelNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelNotAvailableError';
  }
}

/**
 * Generate text using Anthropic's Messages API
 */
export async function generateText(request: AnthropicTextRequest): Promise<AnthropicTextResponse> {
  const startTime = Date.now();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': request.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: request.prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();

    // Check if it's a model not found error
    if (
      response.status === 404 ||
      error.error?.type === 'not_found_error' ||
      error.error?.message?.includes('model') ||
      error.type === 'not_found_error'
    ) {
      throw new ModelNotAvailableError(
        `This model is not available through Anthropic's direct API. Try using the OpenRouter provider instead.`
      );
    }

    throw new Error(
      error.error?.message || error.message || JSON.stringify(error) || 'Anthropic API request failed'
    );
  }

  const data = await response.json();
  const latency = Date.now() - startTime;
  const content = data.content[0]?.type === 'text' ? data.content[0].text : '';
  const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

  return {
    content,
    tokens,
    latency,
  };
}
