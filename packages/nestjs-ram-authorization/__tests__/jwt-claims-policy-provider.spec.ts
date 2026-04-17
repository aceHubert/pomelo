import { JwtClaimsPolicyProvider } from '../src/providers/jwt-claims-policy.provider';
import { PolicySourceType } from '../src/providers/ram-policy-provider.interface';
import { AuthorizeEffect } from '../src/core/AuthorizeEffect';

describe('JwtClaimsPolicyProvider', () => {
  let provider: JwtClaimsPolicyProvider;

  beforeEach(() => {
    provider = new JwtClaimsPolicyProvider('ram');
  });

  it('should have correct source type and priority', () => {
    expect(provider.sourceType).toBe(PolicySourceType.JwtClaims);
    expect(provider.priority).toBe(0);
  });

  describe('getPolicies', () => {
    it('should return empty array when no ram claim', async () => {
      const user = { sub: 'user-123' };
      const policies = await provider.getPolicies(user);
      expect(policies).toEqual([]);
    });

    it('should parse compressed format policy', async () => {
      const user = {
        sub: 'user-123',
        ram: {
          pn: 'user-policy',
          st: [
            {
              e: 'A',
              a: ['basic:user.detail', 'basic:user.list'],
              r: ['ks:basic:user/*'],
            },
            {
              e: 'D',
              a: ['basic:user.delete'],
              r: ['*'],
            },
          ],
        },
      };

      const policies = await provider.getPolicies(user);

      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('user-policy');
      expect(policies[0].Statements).toHaveLength(2);

      const allowStatement = policies[0].Statements![0];
      expect(allowStatement.Effect).toBe(AuthorizeEffect.Allow);
      expect(allowStatement.Action).toEqual(['basic:user.detail', 'basic:user.list']);
      expect(allowStatement.Resource).toEqual(['ks:basic:user/*']);

      const denyStatement = policies[0].Statements![1];
      expect(denyStatement.Effect).toBe(AuthorizeEffect.Deny);
      expect(denyStatement.Action).toEqual(['basic:user.delete']);
      expect(denyStatement.Resource).toEqual(['*']);
    });

    it('should parse standard format policy', async () => {
      const user = {
        sub: 'user-123',
        ram: {
          PolicyName: 'user-policy',
          Statements: [
            {
              Effect: 'ALLOW',
              Action: ['basic:user.detail'],
              Resource: ['ks:basic:user/*'],
            },
          ],
        },
      };

      const policies = await provider.getPolicies(user);

      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('user-policy');
      expect(policies[0].Statements![0].Effect).toBe(AuthorizeEffect.Allow);
    });

    it('should parse array of policies', async () => {
      const user = {
        sub: 'user-123',
        ram: [
          {
            pn: 'policy-1',
            st: [{ e: 'A', a: ['basic:user.*'] }],
          },
          {
            pn: 'policy-2',
            st: [{ e: 'D', a: ['basic:user.delete'] }],
          },
        ],
      };

      const policies = await provider.getPolicies(user);

      expect(policies).toHaveLength(2);
      expect(policies[0].PolicyName).toBe('policy-1');
      expect(policies[1].PolicyName).toBe('policy-2');
    });

    it('should use custom claim name', async () => {
      const customProvider = new JwtClaimsPolicyProvider('customRam');
      const user = {
        sub: 'user-123',
        customRam: {
          pn: 'custom-policy',
          st: [{ e: 'A', a: ['basic:*'] }],
        },
      };

      const policies = await customProvider.getPolicies(user);

      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('custom-policy');
    });

    it('should handle Effect case variations', async () => {
      const user = {
        sub: 'user-123',
        ram: {
          PolicyName: 'test-policy',
          Statements: [
            { Effect: 'Allow', Action: ['basic:action1'] },
            { Effect: 'ALLOW', Action: ['basic:action2'] },
            { Effect: 'Deny', Action: ['basic:action3'] },
            { Effect: 'DENY', Action: ['basic:action4'] },
          ],
        },
      };

      const policies = await provider.getPolicies(user);

      expect(policies[0].Statements![0].Effect).toBe(AuthorizeEffect.Allow);
      expect(policies[0].Statements![1].Effect).toBe(AuthorizeEffect.Allow);
      expect(policies[0].Statements![2].Effect).toBe(AuthorizeEffect.Deny);
      expect(policies[0].Statements![3].Effect).toBe(AuthorizeEffect.Deny);
    });
  });
});
