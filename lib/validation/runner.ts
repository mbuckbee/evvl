/**
 * Validation Test Runner
 *
 * Core logic for executing API validation tests
 */

import { Provider, ModelConfig, TestResult, ApiKeys } from './types';
import { getTestPrompt } from './prompts';

const TEST_TIMEOUT = 30000; // 30 seconds

/**
 * Test a single model
 */
export async function testSingleModel(
  config: ModelConfig,
  apiKey: string
): Promise<TestResult> {
  const startTime = performance.now();
  const prompt = getTestPrompt(config.provider, config.type === 'image');

  const result: TestResult = {
    provider: config.provider,
    model: config.model,
    modelLabel: config.label,
    status: 'running',
    type: config.type, // Type from AIML API: 'image', 'video', 'chat-completion', etc.
    timestamp: Date.now(),
  };

  try {
    // Route to appropriate endpoint based on type
    // - 'image': Use image generation endpoint
    // - 'responses': Use Responses API endpoint (OpenAI only)
    // - All other types: Use chat completions endpoint
    const endpoint = config.type === 'image' ? '/api/generate-image' :
                     config.type === 'responses' ? '/api/generate-response' :
                     '/api/generate';

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TEST_TIMEOUT);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        provider: config.provider,
        model: config.model,
        apiKey,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (response.ok) {
      const data = await response.json();

      result.status = 'success';
      result.latency = latency;

      if (config.type === 'image') {
        result.imageUrl = data.imageUrl;
        result.tokens = data.tokens;
      } else {
        result.content = data.content;
        result.tokens = data.tokens;
      }
    } else {
      const data = await response.json();
      result.status = 'failed';
      result.error = data.error || 'Unknown error';
      result.errorDetails = JSON.stringify(data, null, 2);
    }
  } catch (error: any) {
    result.status = 'failed';

    if (error.name === 'AbortError') {
      result.error = 'Request timeout (30s)';
      result.errorDetails = 'The API request took too long to respond';
    } else {
      result.error = error.message || 'Network error';
      result.errorDetails = error.stack || 'Unknown error occurred';
    }
  }

  return result;
}

/**
 * Run validation tests
 */
export async function runValidation(
  models: ModelConfig[],
  apiKeys: ApiKeys,
  onProgress: (result: TestResult) => void,
  onShouldStop: () => boolean
): Promise<void> {
  for (const model of models) {
    // Check if we should stop
    if (onShouldStop()) {
      break;
    }

    // Check if API key is available for this provider
    const apiKey = apiKeys[model.provider];

    if (!apiKey) {
      // Skip this model - no API key configured
      const result: TestResult = {
        provider: model.provider,
        model: model.model,
        modelLabel: model.label,
        status: 'skipped',
        type: model.type,
        error: 'API key not configured',
        timestamp: Date.now(),
      };
      onProgress(result);
      continue;
    }

    // Run the test
    const result = await testSingleModel(model, apiKey);
    onProgress(result);
  }
}
