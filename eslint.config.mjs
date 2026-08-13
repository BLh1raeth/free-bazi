import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "mobile/babel.config.js",
    "mobile/dist/**",
    "mobile/metro.config.js",
    "scripts/generate-expo-qr.js",
  ]),
]);
