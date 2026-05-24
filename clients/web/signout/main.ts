import { UserManager } from 'oidc-client-ts';
import { prepareOidcSettings } from '@/auth/runtime-options';
import './index.less';

// Update message element
const msgEl = document.getElementById('msg');
if (msgEl) {
  msgEl.innerText = 'You has signed out successfully.';
}

// Handle signout callback
prepareOidcSettings()
  .then((settings) => new UserManager(settings).signoutCallback())
  .catch((error) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Signout callback error:', error);
    }
    if (msgEl) {
      msgEl.innerText = 'Signout error: ' + error.message;
    }
  });
