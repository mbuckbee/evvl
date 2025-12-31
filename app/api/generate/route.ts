import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { transformModelSlug } from '@/lib/model-transformer';

export async function POST(req: NextRequest) {
  try {
    const { prompt, provider, model, apiKey } = await req.json();

    if (!prompt || !provider || !model || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Transform model slug for direct API calls
    const transformedModel = transformModelSlug(provider, model);

    // Log transformation for debugging
    if (model !== transformedModel) {
      console.log(`Model transformation: ${model} → ${transformedModel}`);
    }

    const startTime = Date.now();

    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: transformedModel,
        messages: [{ role: 'user', content: prompt }],
      });

      const latency = Date.now() - startTime;
      const content = completion.choices[0]?.message?.content || '';
      const tokens = completion.usage?.total_tokens || 0;

      return NextResponse.json({
        content,
        tokens,
        latency,
      });
    } else if (provider === 'openrouter') {
      const openai = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });

      const completion = await openai.chat.completions.create({
        model: transformedModel,
        messages: [{ role: 'user', content: prompt }],
      });

      const latency = Date.now() - startTime;
      const content = completion.choices[0]?.message?.content || '';
      const tokens = completion.usage?.total_tokens || 0;

      return NextResponse.json({
        content,
        tokens,
        latency,
      });
    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: transformedModel,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Anthropic API error response:', JSON.stringify(error, null, 2));
        throw new Error(error.error?.message || error.message || JSON.stringify(error) || 'Anthropic API request failed');
      }

      const data = await response.json();
      const latency = Date.now() - startTime;
      const content = data.content[0]?.type === 'text' ? data.content[0].text : '';
      const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      return NextResponse.json({
        content,
        tokens,
        latency,
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported provider' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Generation error:', error);

    // Enhanced error handling for unknown models
    if (error.message?.includes('Unknown') && error.message?.includes('model')) {
      return NextResponse.json(
        { error: `Model not supported: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
