/**
 * OpenAI provider implementation
 *
 * Handles text and image generation using OpenAI's API
 */

// Import shims for Node.js environment (needed for tests)
import 'openai/shims/node';
import OpenAI from 'openai';

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
  size?: '1024x1024' | '1792x1024' | '1024x1792' | '1536x1024' | '1024x1536' | '256x256' | '512x512';
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

  const openai = new OpenAI({ apiKey: request.apiKey });

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

/**
 * Generate image using OpenAI's DALL-E API
 */
export async function generateImage(request: OpenAIImageRequest): Promise<OpenAIImageResponse> {
  const startTime = Date.now();

  const openai = new OpenAI({ apiKey: request.apiKey });

  const response = await openai.images.generate({
    model: request.model,
    prompt: request.prompt,
    n: 1,
    size: request.size || '1024x1024',
    quality: request.quality || 'standard',
    style: request.style || 'vivid',
    response_format: 'url',
  });

  const latency = Date.now() - startTime;

  if (!response.data || response.data.length === 0) {
    throw new Error('No image data returned from OpenAI');
  }

  const imageUrl = response.data[0]?.url;
  const revisedPrompt = response.data[0]?.revised_prompt;

  if (!imageUrl) {
    throw new Error('No image URL returned from OpenAI');
  }

  return {
    imageUrl,
    revisedPrompt: revisedPrompt || request.prompt,
    latency,
  };
}
