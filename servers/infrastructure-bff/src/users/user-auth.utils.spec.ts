import { UserInputError } from '@ace-pomelo/shared/server';
import { assertAllowedEmailSuffix, parseEmailSuffixes } from './user-auth.utils';

describe('user auth utils', () => {
  it('parses register email suffixes', () => {
    expect(parseEmailSuffixes(' company.com, @linux.do, ,EXAMPLE.org ')).toEqual([
      'company.com',
      'linux.do',
      'example.org',
    ]);
  });

  it('rejects empty suffix allow list', () => {
    expect(() => assertAllowedEmailSuffix('user@linux.do', [])).toThrow(UserInputError);
  });

  it('rejects email suffix not in allow list', () => {
    expect(() => assertAllowedEmailSuffix('user@example.com', ['linux.do'])).toThrow(UserInputError);
  });
});
