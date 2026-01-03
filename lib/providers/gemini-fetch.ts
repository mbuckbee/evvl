/**
 * Google Gemini provider implementation using fetch
 *
 * Browser-compatible version that works in Tauri webview
 */

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
 * Generate text using Gemini's REST API
 */
export async function generateText(request: GeminiTextRequest): Promise<GeminiTextResponse> {
  const startTime = Date.now();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${request.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: request.prompt }],
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${request.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: request.prompt }],
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  // Extract image data from response
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part: any) =>
    part.inlineData && (
      !part.inlineData.mimeType ||
      part.inlineData.mimeType.startsWith('image/')
    )
  );

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
