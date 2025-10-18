// ESLint flat config for Deno + npm: toolchain (no local node_modules)
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

// Resolve repo root for TS parser regardless of CWD (e.g., lint-staged)
const tsconfigRootDir = new URL(".", import.meta.url).pathname;

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
        tsconfigRootDir,
        project: ["./tsconfig.json"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Browser globals, use TS for undefined checks
      "no-undef": "off",
      // Defer to TS for unused checks or reduce noise
      "no-unused-vars": "off",
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
