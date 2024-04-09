import { default as pathToRegexp } from 'path-to-regexp';
import { warn } from '@ace-util/core';

// Types
import type { Key, RegExpOptions, ParseOptions } from 'path-to-regexp';

export interface PathRegExp extends RegExp {
  // An array to be populated with the keys found in the path.
  keys: Key[];
}

function attachKeys(regex: RegExp, keys: Key[]): PathRegExp {
  const pathRegex = regex as PathRegExp;
  pathRegex.keys = keys;
  return pathRegex;
}

export function getPathRegex(path: string, options?: RegExpOptions & ParseOptions): PathRegExp {
  const keys: Key[] = [];
  const regex = pathToRegexp(path, keys, options);
  if (process.env.NODE_ENV !== 'production') {
    const _keys: any = Object.create(null);
    keys.forEach((key: Key) => {
      warn(!_keys[key.name], `Duplicate param keys in route with path: "${path}"`);
      _keys[key.name] = true;
    });
  }
  return attachKeys(regex, keys);
}

export function getPathMatch<P extends object = object>(
  ...args: Parameters<typeof pathToRegexp.match>
): ReturnType<typeof pathToRegexp.match<P>> {
  return pathToRegexp.match<P>(...args);
}

export function getPathCompile<P extends object = object>(
  ...args: Parameters<typeof pathToRegexp.compile>
): ReturnType<typeof pathToRegexp.compile<P>> {
  return pathToRegexp.compile<P>(...args);
}
