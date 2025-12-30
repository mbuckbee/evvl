export interface ApiKeys {
  openai?: string;
  anthropic?: string;
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  label: string;
}

export interface AIOutput {
  id: string;
  modelConfig: ModelConfig;
  content: string;
  error?: string;
  tokens?: number;
  latency?: number;
  timestamp: number;
}

export interface Rating {
  outputId: string;
  score: number; // 1-5
  notes?: string;
}

export interface EvalResult {
  id: string;
  prompt: string;
  outputs: AIOutput[];
  ratings: Rating[];
  timestamp: number;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  { provider: 'openai', model: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
  { provider: 'openai', model: 'gpt-4', label: 'GPT-4' },
  { provider: 'openai', model: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { provider: 'anthropic', model: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { provider: 'anthropic', model: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
];
