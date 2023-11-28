import * as http from 'http';

export function isJsonRequest(headers: http.IncomingHttpHeaders) {
  const requestAccept = headers['accept'];
  let contentType = 'text/html';

  if (requestAccept && (requestAccept.includes('json') || requestAccept.includes('text/javascript'))) {
    contentType = 'application/json';
  }

  return contentType === 'application/json';
}
