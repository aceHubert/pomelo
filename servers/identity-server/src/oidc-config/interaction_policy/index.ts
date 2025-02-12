import { interactionPolicy } from 'oidc-provider';
import selectAccount from './prompts/select-account';

const policy = interactionPolicy.base();
policy.add(selectAccount(), 1);

export { policy };
