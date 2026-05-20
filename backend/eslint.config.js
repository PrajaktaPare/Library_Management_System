// ESLint base recommended rules
import js from '@eslint/js';

// Runs Prettier as ESLint rule
import prettier from 'eslint-plugin-prettier';

// Disables ESLint rules conflicting with Prettier
import prettierConfig from 'eslint-config-prettier';

// Import-related linting rules
import importPlugin from 'eslint-plugin-import';

export default [
  // Ignore files and folders
  {
    ignores: ['node_modules/**', 'build/**', 'uploads/**', 'temp/**', '*.log'],
  },

  // Default ESLint recommended rules
  js.configs.recommended,

  // Custom project configuration
  {
    // Apply rules only on JS files
    files: ['**/*.js'],

    // JavaScript environment settings
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',

      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },

    // Register plugins
    plugins: {
      prettier,
      import: importPlugin,
    },

    // ESLint rules
    rules: {
      // Allow console.log but show warning
      'no-console': 'warn',

      // Warn for unused variable s
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],

      // Force === instead of ==
      eqeqeq: ['error', 'always'],

      // Require curly braces
      curly: 'error',

      // Prefer const over let
      'prefer-const': 'error',

      // Disallow var
      'no-var': 'error',

      // Enforce import order
      'import/order': 'error',

      // Prevent duplicate imports
      'import/no-duplicates': 'error',

      // Use single quotes
      quotes: ['error', 'single'],

      // Require semicolons
      semi: ['error', 'always'],

      // Run Prettier formatting as ESLint rule
      'prettier/prettier': 'error',
    },
  },

  // Disable formatting conflicts between ESLint and Prettier
  prettierConfig,
];
