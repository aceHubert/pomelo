import { UserManager } from 'oidc-client-ts';
import { prepareOidcSettings } from '@/auth/runtime-options';

// Handle silent signin callback
prepareOidcSettings()
  .then((settings) => new UserManager(settings).signinSilentCallback())
  .catch((error) => {
    // Silent signin errors are logged silently
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Silent signin callback error:', error);
    }
  });
