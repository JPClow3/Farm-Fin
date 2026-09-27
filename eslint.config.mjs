import js from "@eslint/js";

export default [
  {
    ignores: [
      ".next/**",
      "**/.next/**",
      ".open-next/**",
      ".wrangler/**",
      "**/.wrangler/**",
      "node_modules/**",
      "drizzle/**",
      "temp-app/**",
      "public/**",
      "dist/**",
      "build/**"
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        localStorage: "readonly",
        URL: "readonly",
        Blob: "readonly",
        React: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        vi: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "warn",
    },
  },
];
