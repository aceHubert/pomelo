import { UserManager } from 'oidc-client-ts';
import { envConfig } from '@/configs/env';

// Initialize OIDC UserManager
const userManager = new UserManager(envConfig.getOidcSettings());

// Handle silent signin callback
userManager.signinSilentCallback().catch((error) => {
  // Silent signin errors are logged silently
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error('Silent signin callback error:', error);
  }
});
