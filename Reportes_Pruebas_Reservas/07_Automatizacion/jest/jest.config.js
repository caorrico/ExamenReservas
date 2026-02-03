/**
 * Jest Configuration
 * Sistema de Reservas Backend
 */

module.exports = {
  // Ambiente de ejecución
  testEnvironment: 'node',

  // Directorio raíz
  rootDir: '../../../Reservas_Corregido',

  // Patrones de archivos de test
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],

  // Archivos a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Cobertura de código
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Setup y teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Timeout para tests
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Limpiar mocks entre tests
  clearMocks: true,

  // Forzar exit después de tests
  forceExit: true,

  // Detectar handles abiertos
  detectOpenHandles: true,

  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'junit.xml',
    }],
  ],

  // Módulos a transformar
  transform: {},

  // Variables de entorno para tests
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },

  // Globals
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      JWT_SECRET: 'test_secret_key_for_testing_only_12345678901234567890',
      MONGO_URI: 'mongodb://localhost:27017/reservas_test',
    },
  },
};
