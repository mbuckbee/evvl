/**
 * Client-side analytics helper
 * Sends anonymous usage events to /api/analytics
 * No personal data, API keys, or prompts are sent
 *
 * NOTE: Analytics are only tracked in the web app, not in the Tauri desktop app
 */

import { isTauriEnvironment } from './environment';

export type AnalyticsEvent =
  | 'api_key_added'
  | 'api_key_removed'
  | 'api_key_tested'
  | 'api_key_test_success'
  | 'api_key_test_failure'
  | 'generation_success'
  | 'generation_error';

export interface AnalyticsData {
  provider?: 'openai' | 'anthropic' | 'openrouter' | 'gemini' | 'ollama' | 'lmstudio';
  model?: string;
  error_type?: string;
}

export async function trackEvent(event: AnalyticsEvent, data?: AnalyticsData): Promise<void> {
  // Skip analytics in Tauri desktop app - privacy first
  if (isTauriEnvironment()) {
    return;
  }

  try {
    // Fire and forget - don't block user interactions
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
    }).catch(() => {
      // Silently fail - analytics shouldn't break the app
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
  }
}
