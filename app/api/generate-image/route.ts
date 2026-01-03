import { NextRequest, NextResponse } from 'next/server';
import { transformModelSlug } from '@/lib/model-transformer';
import { openai, gemini } from '@/lib/providers';

export async function POST(req: NextRequest) {
  try {
    const { prompt, provider, model, apiKey, size, quality, style } = await req.json();

    if (!prompt || !provider || !model || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let result;

    if (provider === 'openai') {
      result = await openai.generateImage({
        model,
        prompt,
        apiKey,
        size,
        quality,
        style,
      });
    } else if (provider === 'gemini') {
      // Transform model slug (e.g., google/gemini-3-pro-image-preview → gemini-3-pro-image-preview)
      const transformedModel = transformModelSlug('gemini', model);

      result = await gemini.generateImage({
        model: transformedModel,
        prompt,
        apiKey,
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported provider for image generation' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Image generation error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
