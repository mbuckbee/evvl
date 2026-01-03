/**
 * OpenRouter provider implementation
 *
 * Handles text generation using OpenRouter's API
 * OpenRouter is compatible with OpenAI's API but supports many more models
 */

// Import shims for Node.js environment (needed for tests)
import 'openai/shims/node';
import OpenAI from 'openai';

export interface OpenRouterTextRequest {
  model: string;
  prompt: string;
  apiKey: string;
}

export interface OpenRouterTextResponse {
  content: string;
  tokens: number;
  latency: number;
}

/**
 * Generate text using OpenRouter's chat completions API
 */
export async function generateText(request: OpenRouterTextRequest): Promise<OpenRouterTextResponse> {
  const startTime = Date.now();

  const openai = new OpenAI({
    apiKey: request.apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const completion = await openai.chat.completions.create({
    model: request.model,
    messages: [{ role: 'user', content: request.prompt }],
  });

  const latency = Date.now() - startTime;
  const content = completion.choices[0]?.message?.content || '';
  const tokens = completion.usage?.total_tokens || 0;

  return {
    content,
    tokens,
    latency,
  };
}
