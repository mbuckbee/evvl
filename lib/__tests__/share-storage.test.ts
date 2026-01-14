/**
 * Share Storage Module Tests
 *
 * Tests for Vercel Blob and KV share storage helpers
 *
 * @jest-environment node
 */

// Mock nanoid before importing share-storage
jest.mock('nanoid', () => ({
  nanoid: jest.fn((size: number) => 'A'.repeat(size || 21)),
}));

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    sadd: jest.fn(),
  },
}));

// Mock Vercel Blob
jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
  head: jest.fn(),
  list: jest.fn(),
}));

import {
  generateShareId,
  getExpiryTimestamp,
  checkRateLimit,
  incrementRateLimit,
  getClientIP,
} from '../share-storage';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

describe('Share Storage Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateShareId', () => {
    it('should generate a 10 character ID', () => {
      const id = generateShareId();
      expect(id).toHaveLength(10);
    });

    it('should call nanoid with size 10', () => {
      generateShareId();
      expect(nanoid).toHaveBeenCalledWith(10);
    });
  });

  describe('getExpiryTimestamp', () => {
    it('should return a timestamp 7 days in the future', () => {
      const now = Date.now();
      const expiry = getExpiryTimestamp();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      // Allow 1 second tolerance for test execution time
      expect(expiry).toBeGreaterThanOrEqual(now + sevenDaysMs - 1000);
      expect(expiry).toBeLessThanOrEqual(now + sevenDaysMs + 1000);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests when under limit', async () => {
      (kv.get as jest.Mock).mockResolvedValueOnce(3);

      const result = await checkRateLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 5 - 3 = 2
    });

    it('should deny requests when at limit', async () => {
      (kv.get as jest.Mock).mockResolvedValueOnce(5);

      const result = await checkRateLimit('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should deny requests when over limit', async () => {
      (kv.get as jest.Mock).mockResolvedValueOnce(10);

      const result = await checkRateLimit('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should allow requests when no previous count exists', async () => {
      (kv.get as jest.Mock).mockResolvedValueOnce(null);

      const result = await checkRateLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it('should allow requests when KV fails', async () => {
      (kv.get as jest.Mock).mockRejectedValueOnce(new Error('KV error'));

      const result = await checkRateLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
  });

  describe('incrementRateLimit', () => {
    it('should increment counter and set expiry', async () => {
      await incrementRateLimit('192.168.1.1');

      expect(kv.incr).toHaveBeenCalledTimes(1);
      expect(kv.expire).toHaveBeenCalledTimes(1);

      // Verify expiry is set to 24 hours
      const expireCall = (kv.expire as jest.Mock).mock.calls[0];
      expect(expireCall[1]).toBe(24 * 60 * 60);
    });

    it('should not throw when KV fails', async () => {
      (kv.incr as jest.Mock).mockRejectedValueOnce(new Error('KV error'));

      // Should not throw
      await expect(incrementRateLimit('192.168.1.1')).resolves.toBeUndefined();
    });
  });

  describe('getClientIP', () => {
    // Helper to create mock request with headers
    const createMockRequest = (headers: Record<string, string> = {}) => ({
      headers: {
        get: (name: string) => headers[name.toLowerCase()] || null,
      },
    } as unknown as Request);

    it('should extract IP from x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      });

      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = createMockRequest({
        'x-real-ip': '192.168.1.2',
      });

      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.2');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.2',
      });

      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should return "unknown" when no IP headers present', () => {
      const request = createMockRequest({});

      const ip = getClientIP(request);
      expect(ip).toBe('unknown');
    });
  });
});
