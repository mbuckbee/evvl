/**
 * Validation Types
 *
 * TypeScript interfaces and types for API validation testing
 */

export type Provider = 'openai' | 'anthropic' | 'openrouter' | 'gemini';
export type TestMode = 'full' | 'individual';
export type TestStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'untested' | 'excluded';

/**
 * Models excluded from user-facing app (but visible in backroom for reference)
 * These models require special APIs/tools that the app doesn't support
 */
export const EXCLUDED_MODEL_PATTERNS = [
  /computer-use/i,      // Requires Computer Use tool
  /native-audio/i,      // Requires Live API (WebSocket)
  /robotics/i,          // Robotics models
  /realtime/i,          // Requires WebSocket connection
  /moderation/i,        // Content moderation API
  /tts/i,               // TTS models - not supported yet
];

// Model types from AIML API (not exhaustive, pass through any string)
// Common types: 'image', 'video', 'audio', 'chat-completion', 'responses', 'embedding', 'stt', 'tts'
// We use string instead of a union type to support new types without code changes
export type ModelType = string;

export interface TestResult {
  provider: Provider;
  model: string;
  modelLabel: string;
  status: TestStatus;
  type: ModelType;

  // Success data
  content?: string;
  imageUrl?: string;
  tokens?: number;
  latency?: number;

  // Error data
  error?: string;
  errorDetails?: string;

  timestamp: number;
}

export interface TestSummary {
  total: number;
  tested: number;
  running: number;
  passed: number;
  failed: number;
  skipped: number;
  avgLatency: number;
  totalTokens: number;
}

export interface ModelConfig {
  provider: Provider;
  model: string;
  label: string;
  type: ModelType;
}

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  openrouter?: string;
  gemini?: string;
}
