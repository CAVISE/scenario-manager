const { defineConfig, globalIgnores } = require('eslint/config');
const globals = require('globals');
const { fixupConfigRules } = require('@eslint/compat');
const tsParser = require('@typescript-eslint/parser');
const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parser: tsParser,
    },
    extends: fixupConfigRules(
      compat.extends(
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
        'plugin:react/recommended',
        'plugin:prettier/recommended'
      )
    ),
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'prettier/prettier': 'error',
      'react/no-unescaped-entities': 'off',
    },
    ignores: [
      '**/*.config.js',
      '**/*.config.cjs',
      '**/.eslintrc.cjs',
      '**/.stylelintrc.cjs',
      '**/vite.config.ts',
      '**/vitest.config.ts',
      '**/playwright.config.ts',
      '**/node_modules/**',
      '**/dist/**',
    ],
  },
  globalIgnores(['**/dist', '**/node_modules', '**/public']),
  globalIgnores([
    'public/lib/ModuleOpenDrive.js',
    '**/node_modules',
    '**/dist',
    '**/coverage',
    'docs/venv',
  ]),
]);
