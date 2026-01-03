/**
 * OpenRouter provider implementation using fetch
 *
 * Browser-compatible version that works in Tauri webview
 * OpenRouter is compatible with OpenAI's API but supports many more models
 */

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

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${request.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      messages: [{ role: 'user', content: request.prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  return {
    content: data.choices[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
    latency,
  };
}
