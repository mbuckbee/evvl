import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(req: NextRequest) {
  try {
    // Simple password authentication
    const authHeader = req.headers.get('authorization');
    const expectedPassword = process.env.BACKROOM_PASSWORD || 'evvl-admin-2024';

    if (!authHeader || authHeader !== `Bearer ${expectedPassword}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if KV is available
    let kvAvailable = true;
    try {
      await kv.get('analytics:test');
    } catch (error) {
      kvAvailable = false;
    }

    if (!kvAvailable) {
      return NextResponse.json({
        kvAvailable: false,
        message: 'Vercel KV not configured. Analytics are being logged to Vercel Logs only.',
        stats: null,
      });
    }

    // Fetch all analytics data
    const [
      // Key tracking
      apiKeyAddedTotal,
      apiKeyAddedOpenAI,
      apiKeyAddedAnthropic,
      apiKeyAddedOpenRouter,
      apiKeyRemovedTotal,

      // API key testing
      apiKeyTestedTotal,
      apiKeyTestSuccessTotal,
      apiKeyTestFailureTotal,

      // Generation tracking
      generationSuccessTotal,
      generationSuccessOpenAI,
      generationSuccessAnthropic,
      generationSuccessOpenRouter,

      generationErrorTotal,
      generationErrorOpenAI,
      generationErrorAnthropic,
      generationErrorOpenRouter,

      // Timestamps
      lastKeyAdded,
      lastGeneration,
    ] = await Promise.all([
      kv.get('analytics:api_key_added:total'),
      kv.get('analytics:api_key_added:provider:openai'),
      kv.get('analytics:api_key_added:provider:anthropic'),
      kv.get('analytics:api_key_added:provider:openrouter'),
      kv.get('analytics:api_key_removed:total'),

      kv.get('analytics:api_key_tested:total'),
      kv.get('analytics:api_key_test_success:total'),
      kv.get('analytics:api_key_test_failure:total'),

      kv.get('analytics:generation_success:total'),
      kv.get('analytics:generation_success:provider:openai'),
      kv.get('analytics:generation_success:provider:anthropic'),
      kv.get('analytics:generation_success:provider:openrouter'),

      kv.get('analytics:generation_error:total'),
      kv.get('analytics:generation_error:provider:openai'),
      kv.get('analytics:generation_error:provider:anthropic'),
      kv.get('analytics:generation_error:provider:openrouter'),

      kv.get('analytics:api_key_added:last'),
      kv.get('analytics:generation_success:last'),
    ]);

    const stats = {
      kvAvailable: true,
      apiKeys: {
        total: (apiKeyAddedTotal || 0) as number,
        byProvider: {
          openai: (apiKeyAddedOpenAI || 0) as number,
          anthropic: (apiKeyAddedAnthropic || 0) as number,
          openrouter: (apiKeyAddedOpenRouter || 0) as number,
        },
        removed: (apiKeyRemovedTotal || 0) as number,
        lastAdded: lastKeyAdded as string | null,
      },
      testing: {
        total: (apiKeyTestedTotal || 0) as number,
        successful: (apiKeyTestSuccessTotal || 0) as number,
        failed: (apiKeyTestFailureTotal || 0) as number,
      },
      generations: {
        successful: {
          total: (generationSuccessTotal || 0) as number,
          byProvider: {
            openai: (generationSuccessOpenAI || 0) as number,
            anthropic: (generationSuccessAnthropic || 0) as number,
            openrouter: (generationSuccessOpenRouter || 0) as number,
          },
        },
        errors: {
          total: (generationErrorTotal || 0) as number,
          byProvider: {
            openai: (generationErrorOpenAI || 0) as number,
            anthropic: (generationErrorAnthropic || 0) as number,
            openrouter: (generationErrorOpenRouter || 0) as number,
          },
        },
        lastGeneration: lastGeneration as string | null,
      },
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('[ANALYTICS] Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
