import { UserManager } from 'oidc-client-ts';
import { envConfig } from '@/configs/env';
import './index.less';

// Initialize OIDC UserManager
const userManager = new UserManager(envConfig.getOidcSettings());

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
