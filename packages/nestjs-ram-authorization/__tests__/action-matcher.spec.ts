import { matchAction, matchAnyAction } from '../src/utils/action-matcher';

describe('action-matcher', () => {
  describe('matchAction', () => {
    it('should match exact action', () => {
      expect(matchAction('basic:user.detail', 'basic:user.detail')).toBe(true);
      expect(matchAction('basic:user.detail', 'basic:user.list')).toBe(false);
    });

    it('should match wildcard *', () => {
      expect(matchAction('*', 'basic:user.detail')).toBe(true);
      expect(matchAction('*:*', 'basic:user.detail')).toBe(true);
    });

    it('should match service wildcard', () => {
      expect(matchAction('basic:*', 'basic:user.detail')).toBe(true);
      expect(matchAction('basic:*', 'basic:article.list')).toBe(true);
      expect(matchAction('basic:*', 'other:user.detail')).toBe(false);
    });

    it('should match action prefix wildcard', () => {
      expect(matchAction('basic:user.*', 'basic:user.detail')).toBe(true);
      expect(matchAction('basic:user.*', 'basic:user.list')).toBe(true);
      expect(matchAction('basic:user.*', 'basic:article.list')).toBe(false);
    });

    it('should match globstar **', () => {
      expect(matchAction('basic:**', 'basic:user.detail')).toBe(true);
      expect(matchAction('basic:**', 'basic:user.nested.action')).toBe(true);
    });

    it('should not match different services', () => {
      expect(matchAction('basic:user.detail', 'other:user.detail')).toBe(false);
    });
  });

  describe('matchAnyAction', () => {
    it('should return true if any pattern matches', () => {
      expect(matchAnyAction(['basic:user.detail', 'basic:user.list'], 'basic:user.detail')).toBe(true);
      expect(matchAnyAction(['basic:user.*', 'basic:article.*'], 'basic:user.detail')).toBe(true);
    });

    it('should return false if no pattern matches', () => {
      expect(matchAnyAction(['basic:user.detail', 'basic:user.list'], 'basic:article.detail')).toBe(false);
    });

    it('should return false for empty patterns', () => {
      expect(matchAnyAction([], 'basic:user.detail')).toBe(false);
    });
  });
});
