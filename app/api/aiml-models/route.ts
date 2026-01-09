import { NextResponse } from 'next/server';

/**
 * Proxy endpoint for AIML API models list
 *
 * Fetches from https://api.aimlapi.com/models and returns to client
 * This avoids CORS issues by fetching server-side (Next.js API route)
 *
 * AIML API Response Format:
 * {
 *   object: "list",
 *   data: [
 *     {
 *       id: "openai/gpt-4o",
 *       type: "chat-completion",
 *       info: { name, developer, description, contextLength, maxTokens, ... },
 *       features: [...],
 *       endpoints: [...]
 *     },
 *     ...
 *   ]
 * }
 *
 * We extract the `data` array and return it directly to match our internal format.
 */
export async function GET() {
  try {
    console.log('[AIML API] Fetching models from AIML API...');

    const response = await fetch('https://api.aimlapi.com/models', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[AIML API] Failed to fetch:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch models: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // AIML API returns {object: "list", data: [...]}
    const models = data.data || [];
    console.log(`[AIML API] Successfully fetched ${models.length} models`);

    return NextResponse.json(models);
  } catch (error: any) {
    console.error('[AIML API] Error fetching models:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models from AIML API' },
      { status: 500 }
    );
  }
}
