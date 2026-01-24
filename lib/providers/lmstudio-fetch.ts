/**
 * LM Studio provider implementation using fetch
 *
 * Browser-compatible version that works in Tauri webview.
 * LM Studio runs locally at http://localhost:1234 by default.
 * Uses the OpenAI-compatible API at /v1/chat/completions.
 */

import { getLocalEndpoint } from './local-endpoints';

export interface LMStudioTextRequest {
  model: string;
  prompt: string;
  endpoint?: string; // Optional custom endpoint
}

export interface LMStudioTextResponse {
  content: string;
  tokens: number;
  latency: number;
}

export interface LMStudioModel {
  id: string;
  object: string;
  owned_by: string;
}

export interface LMStudioHealthStatus {
  running: boolean;
  error?: string;
}

const DEFAULT_ENDPOINT = 'http://localhost:1234';
const HEALTH_TIMEOUT = 3000; // 3 seconds for health checks
const GENERATION_TIMEOUT = 30000; // 30 seconds for generation

/**
 * Get the LM Studio endpoint (from localStorage or default)
 */
function getEndpoint(customEndpoint?: string): string {
  if (customEndpoint) return customEndpoint;
  return getLocalEndpoint('lmstudio') || DEFAULT_ENDPOINT;
}

/**
 * Generate text using LM Studio's OpenAI-compatible API
 */
export async function generateText(request: LMStudioTextRequest): Promise<LMStudioTextResponse> {
  const startTime = Date.now();
  const endpoint = getEndpoint(request.endpoint);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT);

  try {
    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model,
        messages: [{ role: 'user', content: request.prompt }],
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || `LM Studio API error: ${response.statusText}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return {
      content: data.choices[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
      latency,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('LM Studio request timed out. Is LM Studio running with the local server enabled?');
    }

    // Check for connection errors
    if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('ECONNREFUSED')) {
      throw new Error('Cannot connect to LM Studio. Open LM Studio and enable the local server.');
    }

    throw error;
  }
}

/**
 * List available models from LM Studio
 */
export async function listModels(endpoint?: string): Promise<LMStudioModel[]> {
  const url = getEndpoint(endpoint);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

  try {
    const response = await fetch(`${url}/v1/models`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to list LM Studio models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('LM Studio connection timed out');
    }

    throw error;
  }
}

/**
 * Check if LM Studio is running and healthy
 */
export async function checkHealth(endpoint?: string): Promise<LMStudioHealthStatus> {
  const url = getEndpoint(endpoint);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

  try {
    // LM Studio's /v1/models endpoint works as a health check
    const response = await fetch(`${url}/v1/models`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { running: true };
    }

    return { running: false, error: `Unexpected status: ${response.status}` };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return { running: false, error: 'Connection timed out' };
    }

    return { running: false, error: 'Cannot connect to LM Studio' };
  }
}
