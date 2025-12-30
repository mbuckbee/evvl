import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { prompt, provider, model, apiKey } = await req.json();

    if (!prompt || !provider || !model || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: model,
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
      const anthropic = new Anthropic({ apiKey });

      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const latency = Date.now() - startTime;
      const content = message.content[0]?.type === 'text' ? message.content[0].text : '';
      const tokens = message.usage?.input_tokens + message.usage?.output_tokens || 0;

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
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
