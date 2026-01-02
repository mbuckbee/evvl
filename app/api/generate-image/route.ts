import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { transformModelSlug } from '@/lib/model-transformer';

export async function POST(req: NextRequest) {
  try {
    const { prompt, provider, model, apiKey, size, quality, style } = await req.json();

    if (!prompt || !provider || !model || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });

      // DALL-E 3 or DALL-E 2
      const response = await openai.images.generate({
        model,
        prompt,
        n: 1,
        size: size || '1024x1024',
        quality: quality || 'standard', // 'standard' or 'hd' (DALL-E 3 only)
        style: style || 'vivid', // 'vivid' or 'natural' (DALL-E 3 only)
        response_format: 'url', // Could also use 'b64_json'
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

      return NextResponse.json({
        imageUrl,
        revisedPrompt: revisedPrompt || prompt,
        latency,
      });
    } else if (provider === 'gemini') {
      // Transform model slug (e.g., google/gemini-3-pro-image-preview → gemini-3-pro-image-preview)
      const transformedModel = transformModelSlug('gemini', model);

      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: transformedModel,
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'] as any,
        },
      });

      const result = await geminiModel.generateContent(prompt);
      const response = result.response;

      const latency = Date.now() - startTime;

      // Extract image data from response
      // Gemini returns image data as inline data in the response parts
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
      const revisedPrompt = textPart?.text || prompt;

      return NextResponse.json({
        imageUrl,
        revisedPrompt,
        latency,
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported provider for image generation' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Image generation error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
