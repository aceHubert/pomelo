import { UserManager } from 'oidc-client-ts';
import { envConfig } from '@/configs/env';
import './index.less';

// Get the OIDC settings from environment configuration
const settings = envConfig.getOidcSettings(process.env.BASE_URL);

// Initialize OIDC UserManager
const userManager = new UserManager(settings);

// DOM elements
const msgEl = document.getElementById('msg') as HTMLElement;
const descEl = document.getElementById('desc') as HTMLElement;
const homeBtn = document.getElementById('home') as HTMLElement;
const RedirectKey = 'po/oidc.redirect';

// Redirect function with countdown
const redirectInSeconds = (seconds?: number): void => {
  const s = seconds ?? 3;
  let msg = '';

  if (s > 0) {
    msg = `Redirect in ${s} seconds...<br/>If the window does not redirect automatically, please click the button below.`;
  }

  if (descEl) {
    descEl.innerHTML = msg;
  }

  if (s <= 0) {
    const win = window.opener || window.parent || window;
    const url = win.localStorage.getItem(RedirectKey) || './';
    win.localStorage.removeItem(RedirectKey);

    if (win.history.replaceState) {
      win.history.replaceState({}, document.title, url);
      win.history.go(0);
    } else {
      win.location.replace(url);
    }
    return;
  }

  setTimeout(() => redirectInSeconds(s - 1), 1000);
};

// Set up home button click handler
if (homeBtn) {
  homeBtn.addEventListener('click', () => redirectInSeconds(0));
}

// Handle signin callback
userManager
  .signinCallback()
  .then((user) => {
    if (!user) {
      if (msgEl) {
        msgEl.innerText = 'No sign-in request pending.';
      }
      redirectInSeconds(3);
      return;
    }
    redirectInSeconds(0);
  })
  .catch((error) => {
    if (homeBtn) {
      homeBtn.style.display = 'block';
    }

    const msg = error.message;
    if (msgEl) {
      if (msg.indexOf('iat is in the future') !== -1 || msg.indexOf('exp is in the past') !== -1) {
        msgEl.innerHTML = '当前设备日期时间有误<br/>请调整为标准北京时间后重新进入';
      } else {
        msgEl.innerHTML = msg;
        redirectInSeconds(3);
      }
    }
  });
