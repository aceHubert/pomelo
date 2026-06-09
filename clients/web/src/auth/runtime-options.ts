import { warn } from '@ace-util/core';
import { envConfig } from '@/configs/env';
import { getBootstrapOptionByName } from '@/fetch/bootstrap';

export const AuthOidcOptionKey = 'auth-oidc';

let authOidcOption: string | undefined;
let authOidcOptionLoaded = false;
let authOidcOptionPromise: Promise<string | undefined> | undefined;

export async function loadAuthOidcOption() {
  if (authOidcOptionLoaded) {
    return authOidcOption;
  }

  if (!authOidcOptionPromise) {
    authOidcOptionPromise = getBootstrapOptionByName(AuthOidcOptionKey)
      .then((option) => {
        authOidcOption = option.value || undefined;
        authOidcOptionLoaded = true;
        return authOidcOption;
      })
      .catch((err: Error) => {
        warn(false, `Auth OIDC option loaded error, ${err.message}`);
        authOidcOption = undefined;
        authOidcOptionLoaded = true;
        return authOidcOption;
      });
  }

  return authOidcOptionPromise;
}

export async function prepareOidcSettings() {
  const settings = envConfig.resolveOidcSettings(await loadAuthOidcOption());
  if (settings) {
    envConfig.setOidcSettings(settings);
  }
  return envConfig.getOidcSettings();
}
