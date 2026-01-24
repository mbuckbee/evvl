export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  openrouter?: string;
  gemini?: string;
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'openrouter' | 'gemini' | 'ollama' | 'lmstudio';
  model: string;
  label: string;
}

export interface AIOutput {
  id: string;
  modelConfig: ModelConfig;
  type: 'text' | 'image';
  content: string; // For text outputs or revised_prompt for images
  imageUrl?: string; // Temporary URL from provider (DALL-E, etc.)
  imageData?: string; // Base64 encoded image data
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

// ============================================================================
// Phase 2: Project-Based Data Model
// ============================================================================

export type Provider = 'openai' | 'anthropic' | 'openrouter' | 'gemini' | 'ollama' | 'lmstudio';

// Advanced AI parameters for model configs and prompts
export interface AIParameters {
  temperature?: number;      // 0-2
  maxTokens?: number;
  topP?: number;            // 0-1
  frequencyPenalty?: number; // -2 to 2
  presencePenalty?: number;  // -2 to 2
  stop?: string[];

  // Image-specific
  imageSize?: string;
  imageQuality?: 'standard' | 'hd';
  imageStyle?: 'vivid' | 'natural';
}

// Top-level organizational unit
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;

  // Project contains these three key entities
  promptIds: string[];      // References to prompts (stored separately)
  modelConfigIds: string[]; // References to model configs (stored separately)
  dataSetIds: string[];     // References to data sets (stored separately)
}

// Prompts are versioned templates
export interface Prompt {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  versions: PromptVersion[];
  currentVersionId: string;
  createdAt: number;
  updatedAt: number;
}

export interface PromptVersion {
  id: string;
  versionNumber: number;
  content: string;              // The prompt template (may include {{variables}})
  systemPrompt?: string;
  parameters?: AIParameters;    // Default parameters for this version
  note?: string;                // What changed in this version
  createdAt: number;
}

// Model configs are reusable model + parameter combinations
export interface ProjectModelConfig {
  id: string;
  projectId: string;
  name: string;                 // e.g., "GPT-4", "GPT-4 with thinking mode"
  provider: Provider;
  model: string;                // e.g., "gpt-4"
  parameters?: AIParameters;    // Custom parameters for this config
  createdAt: number;
}

// Data sets contain test data for batch evaluation
export interface DataSet {
  id: string;
  projectId: string;
  name: string;
  items: DataSetItem[];
  createdAt: number;
  updatedAt: number;
}

export interface DataSetItem {
  id: string;
  name?: string;
  variables: Record<string, string>;  // {"text": "Article...", "tone": "professional"}
}

// Evaluation runs track executions of prompts
export interface EvaluationRun {
  id: string;
  projectId: string;
  promptId: string;
  promptVersionId: string;
  modelConfigIds: string[];      // Which models to test
  dataSetId?: string;            // Optional batch testing
  results: EvaluationResult[];
  status: 'running' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
}

export interface EvaluationResult {
  id: string;
  modelConfigId: string;
  dataSetItemId?: string;        // Which data set item (if batch)
  output: AIOutput;
  rating?: Rating;
  error?: string;
}
