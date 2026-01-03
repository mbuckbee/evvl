/**
 * OpenAI provider implementation using fetch
 *
 * Browser-compatible version that works in Tauri webview
 */

export interface OpenAITextRequest {
  model: string;
  prompt: string;
  apiKey: string;
}

export interface OpenAITextResponse {
  content: string;
  tokens: number;
  latency: number;
}

export interface OpenAIImageRequest {
  model: string;
  prompt: string;
  apiKey: string;
  size?: string;
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface OpenAIImageResponse {
  imageUrl: string;
  revisedPrompt: string;
  latency: number;
}

/**
 * Generate text using OpenAI's chat completions API
 */
export async function generateText(request: OpenAITextRequest): Promise<OpenAITextResponse> {
  const startTime = Date.now();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  return {
    content: data.choices[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
    latency,
  };
}

/**
 * Generate image using OpenAI's DALL-E API
 */
export async function generateImage(request: OpenAIImageRequest): Promise<OpenAIImageResponse> {
  const startTime = Date.now();

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${request.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      prompt: request.prompt,
      n: 1,
      size: request.size || '1024x1024',
      quality: request.quality || 'standard',
      style: request.style || 'vivid',
      response_format: 'url',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  if (!data.data || data.data.length === 0) {
    throw new Error('No image data returned from OpenAI');
  }

  const imageUrl = data.data[0]?.url;
  const revisedPrompt = data.data[0]?.revised_prompt;

  if (!imageUrl) {
    throw new Error('No image URL returned from OpenAI');
  }

  return {
    imageUrl,
    revisedPrompt: revisedPrompt || request.prompt,
    latency,
  };
}
