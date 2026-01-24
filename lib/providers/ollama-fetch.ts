/**
 * Ollama provider implementation using fetch
 *
 * Browser-compatible version that works in Tauri webview.
 * Ollama runs locally at http://localhost:11434 by default.
 * Uses the OpenAI-compatible API at /v1/chat/completions.
 */

import { getLocalEndpoint } from './local-endpoints';

export interface OllamaTextRequest {
  model: string;
  prompt: string;
  endpoint?: string; // Optional custom endpoint
}

export interface OllamaTextResponse {
  content: string;
  tokens: number;
  latency: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaHealthStatus {
  running: boolean;
  error?: string;
}

const DEFAULT_ENDPOINT = 'http://localhost:11434';
const HEALTH_TIMEOUT = 3000; // 3 seconds for health checks
const GENERATION_TIMEOUT = 30000; // 30 seconds for generation

/**
 * Get the Ollama endpoint (from localStorage or default)
 */
function getEndpoint(customEndpoint?: string): string {
  if (customEndpoint) return customEndpoint;
  return getLocalEndpoint('ollama') || DEFAULT_ENDPOINT;
}

/**
 * Generate text using Ollama's OpenAI-compatible API
 */
export async function generateText(request: OllamaTextRequest): Promise<OllamaTextResponse> {
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
      throw new Error(error.error?.message || `Ollama API error: ${response.statusText}`);
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
      throw new Error('Ollama request timed out. Is Ollama running?');
    }

    // Check for connection errors
    if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('ECONNREFUSED')) {
      throw new Error('Cannot connect to Ollama. Start it with: ollama serve');
    }

    throw error;
  }
}

/**
 * List available models from Ollama
 */
export async function listModels(endpoint?: string): Promise<OllamaModel[]> {
  const url = getEndpoint(endpoint);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

  try {
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to list Ollama models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Ollama connection timed out');
    }

    throw error;
  }
}

/**
 * Check if Ollama is running and healthy
 */
export async function checkHealth(endpoint?: string): Promise<OllamaHealthStatus> {
  const url = getEndpoint(endpoint);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

  try {
    // Ollama returns "Ollama is running" at the root endpoint
    const response = await fetch(url, {
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

    return { running: false, error: 'Cannot connect to Ollama' };
  }
}
