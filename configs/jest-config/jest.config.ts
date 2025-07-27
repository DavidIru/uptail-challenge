import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/packages/core/src/$1',
    // '^@utils/(.*)$': '<rootDir>/packages/utils/src/$1',
    // '^@api/(.*)$': '<rootDir>/packages/api/src/$1',
    '^@modules/(.*)$': '<rootDir>/packages/modules/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};

export default config;
