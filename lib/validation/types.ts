/**
 * Validation Types
 *
 * TypeScript interfaces and types for API validation testing
 */

export type Provider = 'openai' | 'anthropic' | 'openrouter' | 'gemini';
export type TestMode = 'quick' | 'full' | 'individual';
export type TestStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

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
