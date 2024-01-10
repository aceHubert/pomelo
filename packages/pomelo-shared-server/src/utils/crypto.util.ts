import * as crypto from 'crypto';

export function md5(str: string, inputEncoding?: crypto.Encoding) {
  const hash = crypto.createHash('md5');

  inputEncoding ? hash.update(str, inputEncoding) : hash.update(str);

  return hash.digest('hex');
}

export function random(length: number) {
  return crypto.randomBytes(length).toString('hex');
}

export function sha256(str: string, inputEncoding?: crypto.Encoding) {
  const hash = crypto.createHash('sha256');

  inputEncoding ? hash.update(str, inputEncoding) : hash.update(str);

  return {
    toString: () => hash.digest('hex'),
    toBase64: () => hash.digest('base64'),
    toBase64Url: () => hash.digest('base64url'),
  };
}
