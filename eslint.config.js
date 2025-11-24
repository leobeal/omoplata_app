const universeNative = require('eslint-config-universe/flat/native');
const globals = require('globals');

module.exports = [
  // Apply universe/native config
  ...universeNative,

  // Node.js config files need Node globals
  {
    files: [
      '*.config.js',
      '*.config.ts',
      'babel.config.js',
      'metro.config.js',
      'tailwind.config.js',
      'jest.config.js',
      'prettier.config.js',
      'postcss.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Global ignores (applies to all files)
  {
    ignores: ['__old/**', '__tests__/**', 'node_modules/**', '.expo/**', 'ios/**', 'android/**'],
  },
];
