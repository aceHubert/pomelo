import * as crypto from 'crypto';

export function md5(str: string, inputEncoding?: crypto.Encoding) {
  const hash = crypto.createHash('md5');

  inputEncoding ? hash.update(str, inputEncoding) : hash.update(str);

  return hash.digest('hex');
}

export function random(length: number) {
  const bytes = crypto.randomBytes(length);

  return {
    toString: () => bytes.toString('hex'),
    toBase64: () => bytes.toString('base64'),
    toBase64Url: () => bytes.toString('base64url'),
  };
}

export function sha256(
  str: string,
  {
    inputEncoding = 'utf8',
    enabledHmac = false,
    key = '',
  }: { inputEncoding?: crypto.Encoding; enabledHmac?: boolean; key?: crypto.BinaryLike | crypto.KeyObject } = {},
) {
  const hash = enabledHmac ? crypto.createHmac('sha256', key) : crypto.createHash('sha256');

  inputEncoding ? hash.update(str, inputEncoding) : hash.update(str);

  return {
    toString: () => hash.digest('hex') as string,
    toBase64: () => hash.digest('base64') as string,
    toBase64Url: () => hash.digest('base64url') as string,
  };
}
