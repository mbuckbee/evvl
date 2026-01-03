/**
 * Google Gemini provider implementation
 *
 * Handles text and image generation using Google's Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiTextRequest {
  model: string;
  prompt: string;
  apiKey: string;
}

export interface GeminiTextResponse {
  content: string;
  tokens: number;
  latency: number;
}

export interface GeminiImageRequest {
  model: string;
  prompt: string;
  apiKey: string;
}

export interface GeminiImageResponse {
  imageUrl: string;
  revisedPrompt: string;
  latency: number;
}

/**
 * Generate text using Gemini's API
 */
export async function generateText(request: GeminiTextRequest): Promise<GeminiTextResponse> {
  const startTime = Date.now();

  const genAI = new GoogleGenerativeAI(request.apiKey);
  const model = genAI.getGenerativeModel({ model: request.model });

  const result = await model.generateContent(request.prompt);
  const response = result.response;
  const content = response.text();

  const latency = Date.now() - startTime;

  // Gemini doesn't provide token counts in the same way, approximate based on content
  const tokens = Math.ceil((request.prompt.length + content.length) / 4);

  return {
    content,
    tokens,
    latency,
  };
}

/**
 * Generate image using Gemini's image generation API
 */
export async function generateImage(request: GeminiImageRequest): Promise<GeminiImageResponse> {
  const startTime = Date.now();

  const genAI = new GoogleGenerativeAI(request.apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: request.model,
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  const result = await geminiModel.generateContent(request.prompt);
  const response = result.response;

  const latency = Date.now() - startTime;

  // Extract image data from response
  const parts = response.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));

  if (!imagePart || !imagePart.inlineData) {
    throw new Error('No image data returned from Gemini');
  }

  // Convert base64 image data to data URL
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  const base64Data = imagePart.inlineData.data;
  const imageUrl = `data:${mimeType};base64,${base64Data}`;

  // Get text response if any (this would be the revised/enhanced prompt)
  const textPart = parts.find((part: any) => part.text);
  const revisedPrompt = textPart?.text || request.prompt;

  return {
    imageUrl,
    revisedPrompt,
    latency,
  };
}
