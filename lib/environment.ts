/**
 * Environment detection utilities for Evvl
 *
 * Detects whether the app is running in:
 * - Tauri desktop app (window.__TAURI__ exists)
 * - Web browser (standard web environment)
 */

export type RuntimeEnvironment = 'tauri' | 'web';

/**
 * Detects the current runtime environment
 *
 * @returns 'tauri' if running in Tauri desktop app, 'web' otherwise
 */
export function getRuntimeEnvironment(): RuntimeEnvironment {
  // Check if we're in a browser environment first
  if (typeof window === 'undefined') {
    return 'web'; // SSR context, treat as web
  }

  // Tauri injects a global __TAURI__ object
  if (typeof (window as any).__TAURI__ !== 'undefined') {
    return 'tauri';
  }

  return 'web';
}

/**
 * Check if currently running in Tauri desktop app
 */
export function isTauriEnvironment(): boolean {
  return getRuntimeEnvironment() === 'tauri';
}

/**
 * Check if currently running in web browser
 */
export function isWebEnvironment(): boolean {
  return getRuntimeEnvironment() === 'web';
}
