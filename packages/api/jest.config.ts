import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/__tests__/**",
    "!src/integrations/handlers/register.ts",
  ],
  coverageDirectory: "coverage",
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterSetup: [],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      { tsconfig: "tsconfig.json", diagnostics: false },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;
