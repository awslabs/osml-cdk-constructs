/*
 * Copyright 2024-2025 Amazon.com, Inc. or its affiliates.
 */

const js = require("@eslint/js");
const typescript = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const importPlugin = require("eslint-plugin-import");
const jestPlugin = require("eslint-plugin-jest");
const prettierPlugin = require("eslint-plugin-prettier");
const promisePlugin = require("eslint-plugin-promise");
const simpleImportSort = require("eslint-plugin-simple-import-sort");

module.exports = [
  // Base configuration
  js.configs.recommended,

  // TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        // Jest globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": typescript,
      import: importPlugin,
      promise: promisePlugin,
      prettier: prettierPlugin,
      jest: jestPlugin,
      "simple-import-sort": simpleImportSort
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...typescript.configs["recommended-requiring-type-checking"].rules,
      ...importPlugin.configs.errors.rules,
      ...importPlugin.configs.warnings.rules,
      ...importPlugin.configs.typescript.rules,
      ...promisePlugin.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      ...jestPlugin.configs.recommended.rules,
      ...jestPlugin.configs.style.rules,

      // Custom rules
      "import/default": "off",
      "import/order": "off",
      "simple-import-sort/imports": "error",
      "require-await": "off",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowTernary: true }
      ],
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/no-empty-function": "off",
      "jest/no-done-callback": "off",
      "jest/no-conditional-expect": "off"
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true
        }
      }
    }
  },

  // JavaScript files
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        // Jest globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly"
      }
    },
    plugins: {
      import: importPlugin,
      promise: promisePlugin,
      prettier: prettierPlugin,
      jest: jestPlugin,
      "simple-import-sort": simpleImportSort
    },
    rules: {
      ...importPlugin.configs.errors.rules,
      ...importPlugin.configs.warnings.rules,
      ...promisePlugin.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      ...jestPlugin.configs.recommended.rules,
      ...jestPlugin.configs.style.rules,

      // Custom rules
      "import/default": "off",
      "import/order": "off",
      "simple-import-sort/imports": "error",
      "require-await": "off",
      "jest/no-done-callback": "off",
      "jest/no-conditional-expect": "off"
    }
  }
];
