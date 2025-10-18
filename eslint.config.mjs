// ESLint flat config for Deno + npm: toolchain (no local node_modules)
import js from "npm:@eslint/js@9.38.0";
import tsPlugin from "npm:@typescript-eslint/eslint-plugin@8.43.0";
import tsParser from "npm:@typescript-eslint/parser@8.43.0";
import globals from "npm:globals@15.12.0";
import importPlugin from "npm:eslint-plugin-import@2.29.0";

export default [
  {
    ignores: ["**/*.js", ".github/**", ".wrangler/**", ".node_modules.bak/**", "static/dist/**"],
  },
  js.configs.recommended,
  // Type-checked rules for TypeScript
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
    },
    rules: {
      // Browser globals, use TS for undefined checks
      "no-undef": "off",
      // Defer to TS for unused checks or reduce noise
      "no-unused-vars": "off",
      // Flag unused exports via ESLint (replacement for knip's export checks)
      "import/no-unused-modules": [
        "error",
        {
          unusedExports: true,
        },
      ],
      // Ported from .eslintrc
      "prefer-arrow-callback": ["warn", { allowNamedFunctions: true }],
      "func-style": ["warn", "declaration", { allowArrowFunctions: false }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "variableLike", format: ["camelCase"] },
        { selector: "memberLike", modifiers: ["private"], format: ["camelCase"], leadingUnderscore: "require" },
        { selector: "variable", types: ["boolean"], format: ["PascalCase"], prefix: ["is", "should", "has", "can", "did", "will"] },
        { selector: "variable", format: ["camelCase", "UPPER_CASE"], leadingUnderscore: "allow", trailingUnderscore: "allow" },
        { selector: "typeParameter", format: ["PascalCase"], prefix: ["T"] },
        { selector: "interface", format: ["PascalCase"], custom: { regex: "^I[A-Z]", match: false } },
        { selector: ["function", "variable"], format: ["camelCase"] },
        { selector: "variable", modifiers: ["destructured"], format: null },
        { selector: "variable", format: ["camelCase"], leadingUnderscore: "allow", trailingUnderscore: "allow" },
        { selector: "variable", types: ["boolean"], format: ["PascalCase"], prefix: ["is", "has", "should", "can", "did", "will"] },
      ],
    },
  },
];
