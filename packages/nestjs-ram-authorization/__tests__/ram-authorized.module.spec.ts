import { RAMPolicy } from '../src/core/RAMPolicy';
import { RAM_POLICY_PROVIDERS } from '../src/constants';
import { RamAuthorizationModule } from '../src/ram-authorized.module';
import { IRamPolicyProvider, PolicySourceType } from '../src/providers/ram-policy-provider.interface';

describe('RamAuthorizationModule', () => {
  it('keeps the JWT provider and appends custom policy providers', () => {
    const customProvider: IRamPolicyProvider = {
      sourceType: PolicySourceType.External,
      priority: 10,
      getPolicies: async () => [new RAMPolicy('custom')],
    };
    const module = RamAuthorizationModule.forRoot({
      serviceName: 'basic',
      policyProviders: [customProvider],
    });
    const registration = module.providers!.find((provider: any) => provider.provide === RAM_POLICY_PROVIDERS) as {
      useFactory: () => IRamPolicyProvider[];
    };

    expect(registration.useFactory()).toEqual([expect.anything(), customProvider]);
  });
});
