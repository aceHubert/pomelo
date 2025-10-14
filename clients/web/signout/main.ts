import { UserManager } from 'oidc-client-ts';
import { envConfig } from '@/configs/env';
import './index.less';

// Get the OIDC settings from environment configuration
const settings = envConfig.getOidcSettings(process.env.BASE_URL);

// Initialize OIDC UserManager
const userManager = new UserManager(settings);

// Update message element
const msgEl = document.getElementById('msg');
if (msgEl) {
  msgEl.innerText = 'You has signed out successfully.';
}

// Handle signout callback
userManager.signoutCallback().catch((error) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error('Signout callback error:', error);
  }
  if (msgEl) {
    msgEl.innerText = 'Signout error: ' + error.message;
  }
});
