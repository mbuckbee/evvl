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

export interface OpenAIResponseRequest {
  model: string;
  prompt: string;
  apiKey: string;
}

export interface OpenAIResponseResponse {
  content: string;
  tokens: number;
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
 * Generate response using OpenAI's Responses API
 *
 * The Responses API is OpenAI's newer API (March 2025) that provides:
 * - Server-side state management
 * - Built-in tools (web search, code interpreter, etc.)
 * - Better performance for reasoning models
 * - Lower costs through better caching
 *
 * For validation purposes, we use basic stateless requests similar to Chat Completions.
 *
 * Note: The OpenAI SDK might use `client.responses.create()` or `client.chat.completions.create()`
 * depending on SDK version. We use chat.completions for compatibility.
 */
export async function generateResponse(request: OpenAIResponseRequest): Promise<OpenAIResponseResponse> {
  const startTime = Date.now();

  const openai = new OpenAI({ apiKey: request.apiKey });

  // Use chat.completions.create() - it should route to Responses API for compatible models
  // The SDK automatically uses the correct endpoint based on the model
  const completion = await openai.chat.completions.create({
    model: request.model,
    messages: [{ role: 'user', content: request.prompt }],
    // For Responses API models, the SDK will use /v1/responses endpoint
    // For regular models, it will use /v1/chat/completions
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

  // Detect model type for parameter compatibility
  const isDalle3 = request.model.includes('dall-e-3');
  const isDalle = request.model.includes('dall-e');
  const isGptImage = request.model.includes('gpt-image');

  // Build request parameters based on model
  const imageParams: any = {
    model: request.model,
    prompt: request.prompt,
    n: 1,
    size: request.size || '1024x1024',
  };

  // response_format is supported by DALL-E models but not GPT Image models
  if (isDalle) {
    imageParams.response_format = 'url';
  }

  // quality and style are only supported by DALL-E 3
  if (isDalle3) {
    if (request.quality) {
      imageParams.quality = request.quality;
    }
    if (request.style) {
      imageParams.style = request.style;
    }
  }

  const response = await openai.images.generate(imageParams);

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
