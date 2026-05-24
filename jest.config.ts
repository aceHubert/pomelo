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
        '^@ace-pomelo/shared/(.*)$': '<rootDir>/../../../packages/pomelo-shared/src/$1',
        '^@ace-nestjs/authorization$': '<rootDir>/../../../packages/nestjs-authorization/src',
        '^@ace-nestjs/authorization/(.*)$': '<rootDir>/../../../packages/nestjs-authorization/src/$1',
        '^@ace-nestjs/ram-authorization$': '<rootDir>/../../../packages/nestjs-ram-authorization/src',
        '^@ace-nestjs/ram-authorization/(.*)$': '<rootDir>/../../../packages/nestjs-ram-authorization/src/$1',
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
        '^@ace-pomelo/shared/(.*)$': '<rootDir>/../../../packages/pomelo-shared/src/$1',
        '^@ace-nestjs/authorization$': '<rootDir>/../../../packages/nestjs-authorization/src',
        '^@ace-nestjs/authorization/(.*)$': '<rootDir>/../../../packages/nestjs-authorization/src/$1',
        '^@ace-nestjs/ram-authorization$': '<rootDir>/../../../packages/nestjs-ram-authorization/src',
        '^@ace-nestjs/ram-authorization/(.*)$': '<rootDir>/../../../packages/nestjs-ram-authorization/src/$1',
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
        '^@ace-pomelo/shared/(.*)$': '<rootDir>/../../../packages/pomelo-shared/src/$1',
        '^@ace-nestjs/authorization$': '<rootDir>/../../../packages/nestjs-authorization/src',
        '^@ace-nestjs/authorization/(.*)$': '<rootDir>/../../../packages/nestjs-authorization/src/$1',
        '^@ace-nestjs/ram-authorization$': '<rootDir>/../../../packages/nestjs-ram-authorization/src',
        '^@ace-nestjs/ram-authorization/(.*)$': '<rootDir>/../../../packages/nestjs-ram-authorization/src/$1',
      },
      testEnvironment: 'node',
    },
    {
      displayName: 'nest-ram-authorization',
      moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
      rootDir: 'packages/nestjs-ram-authorization',
      testRegex: '.*\\.spec\\.ts$',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      testEnvironment: 'node',
    },
  ],
});
