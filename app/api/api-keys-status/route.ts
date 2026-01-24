/**
 * API Keys Status Endpoint
 *
 * GET /api/api-keys-status
 *
 * Returns which API keys are configured on the server.
 * Does not expose the actual keys, just boolean status.
 */

import { NextResponse } from 'next/server';

export interface ApiKeysStatus {
  openai: boolean;
  anthropic: boolean;
  gemini: boolean;
  openrouter: boolean;
}

export async function GET() {
  const status: ApiKeysStatus = {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
  };

  return NextResponse.json(status);
}
