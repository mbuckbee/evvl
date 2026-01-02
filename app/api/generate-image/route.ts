import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
