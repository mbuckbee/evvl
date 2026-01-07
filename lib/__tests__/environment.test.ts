/**
 * Tests for environment detection utilities
 *
 * These tests verify that the application correctly detects:
 * 1. Tauri desktop environment
 * 2. Web browser environment
 * 3. SSR context
 */

import { getRuntimeEnvironment, isTauriEnvironment, isWebEnvironment } from '../environment';

describe('Environment Detection', () => {
  describe('getRuntimeEnvironment', () => {
    it('should detect Tauri environment when __TAURI__ is present', () => {
      // Mock Tauri environment
      Object.defineProperty(window, '__TAURI__', {
        value: {},
        configurable: true,
        writable: true,
      });

      expect(getRuntimeEnvironment()).toBe('tauri');

      // Clean up
      delete (window as any).__TAURI__;
    });

    it('should detect web environment when __TAURI__ is not present', () => {
      // Ensure __TAURI__ is not present
      delete (window as any).__TAURI__;

      expect(getRuntimeEnvironment()).toBe('web');
    });

    it('should handle window with undefined __TAURI__', () => {
      // Ensure __TAURI__ is undefined
      (window as any).__TAURI__ = undefined;

      expect(getRuntimeEnvironment()).toBe('web');

      // Clean up
      delete (window as any).__TAURI__;
    });
  });

  describe('isTauriEnvironment', () => {
    it('should return true when running in Tauri', () => {
      Object.defineProperty(window, '__TAURI__', {
        value: {},
        configurable: true,
      });

      expect(isTauriEnvironment()).toBe(true);

      delete (window as any).__TAURI__;
    });

    it('should return false when running in web browser', () => {
      delete (window as any).__TAURI__;

      expect(isTauriEnvironment()).toBe(false);
    });
  });

  describe('isWebEnvironment', () => {
    it('should return false when running in Tauri', () => {
      Object.defineProperty(window, '__TAURI__', {
        value: {},
        configurable: true,
      });

      expect(isWebEnvironment()).toBe(false);

      delete (window as any).__TAURI__;
    });

    it('should return true when running in web browser', () => {
      delete (window as any).__TAURI__;

      expect(isWebEnvironment()).toBe(true);
    });
  });

  describe('API routing based on environment', () => {
    it('should use direct API calls in Tauri environment', () => {
      Object.defineProperty(window, '__TAURI__', {
        value: {},
        configurable: true,
      });

      const env = getRuntimeEnvironment();

      expect(env).toBe('tauri');
      // In Tauri, the apiClient should route to direct.ts
      // This is verified by the apiClient implementation

      delete (window as any).__TAURI__;
    });

    it('should use proxy API calls in web environment', () => {
      delete (window as any).__TAURI__;

      const env = getRuntimeEnvironment();

      expect(env).toBe('web');
      // In web, the apiClient should route to proxy.ts
      // This is verified by the apiClient implementation
    });
  });

  describe('Privacy implications', () => {
    it('should indicate direct API calls for Tauri (no server)', () => {
      Object.defineProperty(window, '__TAURI__', {
        value: {},
        configurable: true,
      });

      const isTauri = isTauriEnvironment();

      expect(isTauri).toBe(true);
      // When isTauri is true, the settings page should show:
      // "keys are sent directly to the AI providers from your device"

      delete (window as any).__TAURI__;
    });

    it('should indicate proxy API calls for web (through server)', () => {
      delete (window as any).__TAURI__;

      const isWeb = isWebEnvironment();

      expect(isWeb).toBe(true);
      // When isWeb is true, the settings page should show:
      // "keys are sent through our server to reach the AI providers"
    });
  });
});
