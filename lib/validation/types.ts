/**
 * Validation Types
 *
 * TypeScript interfaces and types for API validation testing
 */

export type Provider = 'openai' | 'anthropic' | 'openrouter' | 'gemini';
export type TestMode = 'quick' | 'full' | 'individual';
export type TestStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';
export type ModelType = 'text' | 'image';

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
