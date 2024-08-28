const re = /(\S+)\s+(\S+)/,
  AUTH_HEADER = 'authorization',
  BEARER_AUTH_SCHEME = 'bearer';

function parseAuthHeader(hdrValue: string) {
  if (typeof hdrValue !== 'string') {
    return null;
  }
  const matches = hdrValue.match(re);
  return matches && { scheme: matches[1], value: matches[2] };
}

export function fromAuthHeaderWithScheme(auth_scheme: string) {
  const auth_scheme_lower = auth_scheme.toLowerCase();
  return (request: { headers: Record<string, any> }) => {
    let token = null;
    if (request.headers[AUTH_HEADER]) {
      const auth_params = parseAuthHeader(request.headers[AUTH_HEADER]);
      if (auth_params && auth_scheme_lower === auth_params.scheme.toLowerCase()) {
        token = auth_params.value;
      }
    }
    return token;
  };
}

export const fromAuthHeaderAsBearerToken = fromAuthHeaderWithScheme(BEARER_AUTH_SCHEME);
