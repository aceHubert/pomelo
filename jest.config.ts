import { defaults } from 'jest-config';

import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => ({
  verbose: true,
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  projects: [
    {
      displayName: 'identity-server',
      moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
      rootDir: 'servers/identity-server/src',
      testRegex: '.*\\.spec\\.ts$',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)': '<rootDir>/$1',
      },
      testEnvironment: 'node',
    },
    {
      displayName: 'infrastructure-bff',
      moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
      rootDir: 'servers/infrastructure-bff/src',
      testRegex: '.*\\.spec\\.ts$',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)': '<rootDir>/$1',
      },
      testEnvironment: 'node',
    },
    {
      displayName: 'infrastructure-service',
      moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
      rootDir: 'servers/infrastructure-service/src',
      testRegex: '.*\\.spec\\.ts$',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)': '<rootDir>/$1',
      },
      testEnvironment: 'node',
    },
  ],
});
