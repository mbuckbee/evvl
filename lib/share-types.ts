// Types for the sharing feature

export interface SharedEvaluation {
  id: string;                    // nanoid
  createdAt: number;
  expiresAt: number;
  createdBy?: string;            // user ID if authenticated (future)

  // Snapshot of the evaluation
  prompt: {
    name: string;
    content: string;             // The actual prompt text
    systemPrompt?: string;
  };

  responses: SharedResponse[];

  // Optional metadata
  title?: string;
  description?: string;
  variables?: Record<string, string>;  // If prompt had variables
}

export interface SharedResponse {
  provider: string;              // 'openai', 'anthropic', etc.
  model: string;                 // 'gpt-4', 'claude-3-opus', etc.
  modelName: string;             // Display name
  type: 'text' | 'image';
  content: string;               // Text response or base64 image
  latency?: number;
  tokens?: number;
}

export interface ShareMetadata {
  id: string;
  createdAt: number;
  expiresAt: number;
  blobUrl: string;
  promptPreview: string;         // First 100 chars of prompt for admin view
}

export interface CreateShareRequest {
  prompt: {
    name: string;
    content: string;
    systemPrompt?: string;
  };
  responses: SharedResponse[];
  title?: string;
  description?: string;
  variables?: Record<string, string>;
}

export interface CreateShareResponse {
  success: true;
  shareId: string;
  shareUrl: string;
  expiresAt: number;
}

export interface ShareError {
  success: false;
  error: string;
  code: 'MODERATION_FAILED' | 'RATE_LIMITED' | 'INVALID_REQUEST' | 'SERVER_ERROR';
}

export type CreateShareResult = CreateShareResponse | ShareError;
