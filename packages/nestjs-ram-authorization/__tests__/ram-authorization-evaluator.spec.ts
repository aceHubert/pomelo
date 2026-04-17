import { RAMAuthorizationEvaluator } from '../src/core/RAMAuthorizationEvaluator';
import { RAMAuthorizeContext } from '../src/core/RAMAuthorizeContext';
import { RAMPolicy } from '../src/core/RAMPolicy';
import { RAMStatement } from '../src/core/RAMStatement';
import { AuthorizeEffect } from '../src/core/AuthorizeEffect';
import { DEFAULT_RESOURCE_PREFIX } from '../src/utils/resource-matcher';

describe('RAMAuthorizationEvaluator', () => {
  let evaluator: RAMAuthorizationEvaluator;
  const prefix = DEFAULT_RESOURCE_PREFIX; // 'po'

  beforeEach(() => {
    evaluator = new RAMAuthorizationEvaluator();
  });

  describe('evaluateAsync', () => {
    it('should allow when explicit Allow matches', async () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:user.detail'],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.detail', [policy]);
      const result = await evaluator.evaluateAsync(context);
      expect(result).toBe(true);
    });

    it('should deny when no matching Allow', async () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:user.list'],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.detail', [policy]);
      const result = await evaluator.evaluateAsync(context);
      expect(result).toBe(false);
    });

    it('should deny when explicit Deny matches (Deny takes priority)', async () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:user.*'],
        }),
        new RAMStatement({
          Effect: AuthorizeEffect.Deny,
          Action: ['basic:user.delete'],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.delete', [policy]);
      const result = await evaluator.evaluateAsync(context);
      expect(result).toBe(false);
    });

    it('should allow when Allow matches and Deny does not', async () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:user.*'],
        }),
        new RAMStatement({
          Effect: AuthorizeEffect.Deny,
          Action: ['basic:user.delete'],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.detail', [policy]);
      const result = await evaluator.evaluateAsync(context);
      expect(result).toBe(true);
    });

    it('should deny when no policies', async () => {
      const context = new RAMAuthorizeContext('basic', 'user.detail', []);
      const result = await evaluator.evaluateAsync(context);
      expect(result).toBe(false);
    });

    it('should match wildcard actions', async () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:*'],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.detail', [policy]);
      const result = await evaluator.evaluateAsync(context);
      expect(result).toBe(true);
    });

    it('should check resource when provided', async () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:user.detail'],
          Resource: [`${prefix}:basic:user/123`],
        }),
      ];

      const context1 = new RAMAuthorizeContext('basic', 'user.detail', [policy], 'user', '123');
      const result1 = await evaluator.evaluateAsync(context1);
      expect(result1).toBe(true);

      const context2 = new RAMAuthorizeContext('basic', 'user.detail', [policy], 'user', '456');
      const result2 = await evaluator.evaluateAsync(context2);
      expect(result2).toBe(false);
    });

    it('should allow when resource matches wildcard', async () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:user.detail'],
          Resource: [`${prefix}:basic:user/*`],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.detail', [policy], 'user', '123');
      const result = await evaluator.evaluateAsync(context);
      expect(result).toBe(true);
    });
  });

  describe('evaluateForResources', () => {
    it('should return allowed resource IDs', () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:user.paged-list'],
          Resource: [`${prefix}:basic:user/123`, `${prefix}:basic:user/456`],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.paged-list', [policy], 'user');
      const result = evaluator.evaluateForResources(context, 'user');

      expect(result.allowed).toBe(true);
      expect(result.allowedResourceIds).toContain('123');
      expect(result.allowedResourceIds).toContain('456');
      expect(result.wildcardAllowed).toBe(false);
    });

    it('should detect wildcard allowed', () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:user.paged-list'],
          Resource: [`${prefix}:basic:user/*`],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.paged-list', [policy], 'user');
      const result = evaluator.evaluateForResources(context, 'user');

      expect(result.allowed).toBe(true);
      expect(result.wildcardAllowed).toBe(true);
    });

    it('should return denied resource IDs', () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:user.paged-list'],
          Resource: [`${prefix}:basic:user/*`],
        }),
        new RAMStatement({
          Effect: AuthorizeEffect.Deny,
          Action: ['basic:user.paged-list'],
          Resource: [`${prefix}:basic:user/789`],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.paged-list', [policy], 'user');
      const result = evaluator.evaluateForResources(context, 'user');

      expect(result.allowed).toBe(true);
      expect(result.wildcardAllowed).toBe(true);
      expect(result.deniedResourceIds).toContain('789');
    });

    it('should detect wildcard denied', () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Deny,
          Action: ['basic:user.paged-list'],
          Resource: [`${prefix}:basic:user/*`],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.paged-list', [policy], 'user');
      const result = evaluator.evaluateForResources(context, 'user');

      expect(result.allowed).toBe(false);
      expect(result.wildcardDenied).toBe(true);
    });

    it('should remove denied IDs from allowed list', () => {
      const policy = new RAMPolicy('test-policy');
      policy.Statements = [
        new RAMStatement({
          Effect: AuthorizeEffect.Allow,
          Action: ['basic:user.paged-list'],
          Resource: [`${prefix}:basic:user/123`, `${prefix}:basic:user/456`, `${prefix}:basic:user/789`],
        }),
        new RAMStatement({
          Effect: AuthorizeEffect.Deny,
          Action: ['basic:user.paged-list'],
          Resource: [`${prefix}:basic:user/456`],
        }),
      ];

      const context = new RAMAuthorizeContext('basic', 'user.paged-list', [policy], 'user');
      const result = evaluator.evaluateForResources(context, 'user');

      expect(result.allowedResourceIds).toContain('123');
      expect(result.allowedResourceIds).toContain('789');
      expect(result.allowedResourceIds).not.toContain('456');
      expect(result.deniedResourceIds).toContain('456');
    });
  });
});
