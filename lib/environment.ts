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

  // Tauri 2.0 injects a global __TAURI__ object when withGlobalTauri is true
  // Also check for __TAURI_INTERNALS__ which is always present in Tauri
  const hasTauriGlobal = typeof (window as any).__TAURI__ !== 'undefined';
  const hasTauriInternals = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';

  if (hasTauriGlobal || hasTauriInternals) {
    return 'tauri';
  }

  return 'web';
}

/**
 * Check if currently running in Tauri desktop app
 */
export function isTauriEnvironment(): boolean {
  const result = getRuntimeEnvironment() === 'tauri';
  // Debug logging - can be removed later
  if (typeof window !== 'undefined') {
    console.log('[Environment] isTauriEnvironment:', result, {
      __TAURI__: typeof (window as any).__TAURI__,
      __TAURI_INTERNALS__: typeof (window as any).__TAURI_INTERNALS__,
    });
  }
  return result;
}

/**
 * Check if currently running in web browser
 */
export function isWebEnvironment(): boolean {
  return getRuntimeEnvironment() === 'web';
}
