import { warn } from '@ace-util/core';
import { envConfig } from '@/configs/env';

export const AuthOidcOptionKey = 'auth-oidc';

let autoloadOptions: Record<string, string> | undefined;
let autoloadOptionsPromise: Promise<Record<string, string>> | undefined;

export function setAutoloadOptions(options: Record<string, string>) {
  autoloadOptions = options;
}

export function getAutoloadOptions() {
  return autoloadOptions;
}

export function getAuthOidcOption(options: Record<string, string> = autoloadOptions || {}) {
  return options[AuthOidcOptionKey];
}

export async function loadAutoloadOptions() {
  if (autoloadOptions) {
    return autoloadOptions;
  }

  if (!autoloadOptionsPromise) {
    autoloadOptionsPromise = fetch(envConfig.basicGraphqlBase, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        apikey: 'pomelo-local',
      },
      body: JSON.stringify({
        query: `query getAutoloadOptions { options: autoloadOptions }`,
      }),
    })
      .then(async (resp) => {
        const data = await resp.json();
        if (data.errors?.length) {
          throw new Error(data.errors[0].message);
        }
        autoloadOptions = data.data?.options || {};
        return autoloadOptions;
      })
      .catch((err: Error) => {
        warn(false, `Options loaded error, ${err.message}`);
        autoloadOptions = {};
        return autoloadOptions;
      });
  }

  return autoloadOptionsPromise;
}

export async function prepareOidcSettings() {
  const options = await loadAutoloadOptions();
  const settings = envConfig.resolveOidcSettings(getAuthOidcOption(options));
  if (settings) {
    envConfig.setOidcSettings(settings);
  }
  return envConfig.getOidcSettings();
}
