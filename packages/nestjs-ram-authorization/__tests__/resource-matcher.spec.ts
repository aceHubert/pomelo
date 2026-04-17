import {
  matchResource,
  matchAnyResource,
  extractResourceIds,
  buildResourceUrn,
  DEFAULT_RESOURCE_PREFIX,
} from '../src/utils/resource-matcher';

describe('resource-matcher', () => {
  const prefix = DEFAULT_RESOURCE_PREFIX; // 'po'

  describe('matchResource', () => {
    it('should match exact resource', () => {
      expect(matchResource(`${prefix}:basic:user/123`, `${prefix}:basic:user/123`)).toBe(true);
      expect(matchResource(`${prefix}:basic:user/123`, `${prefix}:basic:user/456`)).toBe(false);
    });

    it('should match wildcard *', () => {
      expect(matchResource('*', `${prefix}:basic:user/123`)).toBe(true);
      expect(matchResource(`${prefix}:*`, `${prefix}:basic:user/123`)).toBe(true);
      expect(matchResource(`${prefix}:*:*`, `${prefix}:basic:user/123`)).toBe(true);
    });

    it('should match service wildcard', () => {
      expect(matchResource(`${prefix}:basic:*`, `${prefix}:basic:user/123`)).toBe(true);
      expect(matchResource(`${prefix}:basic:*`, `${prefix}:basic:article/456`)).toBe(true);
      expect(matchResource(`${prefix}:basic:*`, `${prefix}:other:user/123`)).toBe(false);
    });

    it('should match resource type wildcard', () => {
      expect(matchResource(`${prefix}:basic:user/*`, `${prefix}:basic:user/123`)).toBe(true);
      expect(matchResource(`${prefix}:basic:user/*`, `${prefix}:basic:user/456`)).toBe(true);
      expect(matchResource(`${prefix}:basic:user/*`, `${prefix}:basic:article/123`)).toBe(false);
    });

    it('should match globstar **', () => {
      expect(matchResource(`${prefix}:basic:**`, `${prefix}:basic:user/123`)).toBe(true);
      expect(matchResource(`${prefix}:basic:**`, `${prefix}:basic:user/nested/path`)).toBe(true);
    });

    it('should not match different services', () => {
      expect(matchResource(`${prefix}:basic:user/123`, `${prefix}:other:user/123`)).toBe(false);
    });

    it('should work with custom prefix', () => {
      expect(matchResource('custom:basic:user/123', 'custom:basic:user/123', 'custom')).toBe(true);
      expect(matchResource('custom:*', 'custom:basic:user/123', 'custom')).toBe(true);
    });

    it('should work without prefix', () => {
      expect(matchResource('basic:user/123', 'basic:user/123', '')).toBe(true);
      expect(matchResource('*', 'basic:user/123', '')).toBe(true);
    });
  });

  describe('matchAnyResource', () => {
    it('should return true if any pattern matches', () => {
      expect(
        matchAnyResource([`${prefix}:basic:user/123`, `${prefix}:basic:user/456`], `${prefix}:basic:user/123`),
      ).toBe(true);
      expect(
        matchAnyResource([`${prefix}:basic:user/*`, `${prefix}:basic:article/*`], `${prefix}:basic:user/123`),
      ).toBe(true);
    });

    it('should return false if no pattern matches', () => {
      expect(
        matchAnyResource([`${prefix}:basic:user/123`, `${prefix}:basic:user/456`], `${prefix}:basic:user/789`),
      ).toBe(false);
    });

    it('should return true for empty or undefined patterns', () => {
      expect(matchAnyResource([], `${prefix}:basic:user/123`)).toBe(true);
      expect(matchAnyResource(undefined, `${prefix}:basic:user/123`)).toBe(true);
    });
  });

  describe('extractResourceIds', () => {
    it('should extract specific resource IDs', () => {
      const patterns = [`${prefix}:basic:user/123`, `${prefix}:basic:user/456`];
      const result = extractResourceIds(patterns, 'basic', 'user');
      expect(result.ids).toEqual(['123', '456']);
      expect(result.hasWildcard).toBe(false);
    });

    it('should detect wildcard patterns', () => {
      const patterns = [`${prefix}:basic:user/*`];
      const result = extractResourceIds(patterns, 'basic', 'user');
      expect(result.hasWildcard).toBe(true);
    });

    it('should detect service-level wildcard', () => {
      const patterns = [`${prefix}:basic:*`];
      const result = extractResourceIds(patterns, 'basic', 'user');
      expect(result.hasWildcard).toBe(true);
    });

    it('should detect global wildcard', () => {
      const patterns = [`${prefix}:*`];
      const result = extractResourceIds(patterns, 'basic', 'user');
      expect(result.hasWildcard).toBe(true);
    });

    it('should handle mixed patterns', () => {
      const patterns = [`${prefix}:basic:user/123`, `${prefix}:basic:user/*`, `${prefix}:basic:user/456`];
      const result = extractResourceIds(patterns, 'basic', 'user');
      expect(result.ids).toEqual(['123', '456']);
      expect(result.hasWildcard).toBe(true);
    });

    it('should return empty for undefined patterns', () => {
      const result = extractResourceIds(undefined, 'basic', 'user');
      expect(result.ids).toEqual([]);
      expect(result.hasWildcard).toBe(false);
    });

    it('should ignore patterns for different resource types', () => {
      const patterns = [`${prefix}:basic:article/123`, `${prefix}:basic:user/456`];
      const result = extractResourceIds(patterns, 'basic', 'user');
      expect(result.ids).toEqual(['456']);
    });

    it('should work with custom prefix', () => {
      const patterns = ['custom:basic:user/123', 'custom:basic:user/456'];
      const result = extractResourceIds(patterns, 'basic', 'user', 'custom');
      expect(result.ids).toEqual(['123', '456']);
    });
  });

  describe('buildResourceUrn', () => {
    it('should build correct URN with default prefix', () => {
      expect(buildResourceUrn('basic', 'user', '123')).toBe(`${prefix}:basic:user/123`);
      expect(buildResourceUrn('basic', 'user', 456)).toBe(`${prefix}:basic:user/456`);
    });

    it('should build correct URN with custom prefix', () => {
      expect(buildResourceUrn('basic', 'user', '123', 'custom')).toBe('custom:basic:user/123');
    });

    it('should build correct URN without prefix', () => {
      expect(buildResourceUrn('basic', 'user', '123', '')).toBe('basic:user/123');
    });
  });
});
