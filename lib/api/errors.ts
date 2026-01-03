/**
 * Unified error handling for API client
 *
 * Provides consistent error handling across proxy and direct implementations
 */

import { ApiErrorResponse } from './types';

/**
 * Convert any error to a consistent ApiErrorResponse
 *
 * @param error - The error to convert
 * @param fallbackMessage - Fallback message if error doesn't have one
 * @returns Standardized error response
 */
export function toApiError(error: any, fallbackMessage = 'Unknown error occurred'): ApiErrorResponse {
  // If it's already an ApiErrorResponse, return it
  if (error && typeof error === 'object' && 'error' in error && typeof error.error === 'string') {
    return error;
  }

  // Extract error message
  let message = fallbackMessage;

  if (error) {
    if (typeof error === 'string') {
      message = error;
    } else if (error.message) {
      message = error.message;
    } else if (error.error) {
      message = error.error;
    }
  }

  return { error: message };
}

/**
 * Sanitize error objects to remove sensitive information like API keys
 *
 * @param error - The error to sanitize
 * @returns Sanitized error object safe for logging
 */
export function sanitizeError(error: any): any {
  if (!error) return error;

  const sanitized = { ...error };

  // Remove common API key fields
  if (sanitized.config?.headers?.['x-api-key']) {
    sanitized.config.headers['x-api-key'] = '[REDACTED]';
  }
  if (sanitized.config?.headers?.['Authorization']) {
    sanitized.config.headers['Authorization'] = '[REDACTED]';
  }
  if (sanitized.apiKey) {
    sanitized.apiKey = '[REDACTED]';
  }

  return sanitized;
}
