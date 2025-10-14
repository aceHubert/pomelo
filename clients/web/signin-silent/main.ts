import { UserManager } from 'oidc-client-ts';
import { envConfig } from '@/configs/env';

// Get the OIDC settings from environment configuration
const settings = envConfig.getOidcSettings(process.env.BASE_URL);

// Initialize OIDC UserManager
const userManager = new UserManager(settings);

// Handle silent signin callback
userManager.signinSilentCallback().catch((error) => {
  // Silent signin errors are logged silently
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error('Silent signin callback error:', error);
  }
});
