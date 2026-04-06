import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "eslint-config-next";

const eslintConfig = defineConfig([
  ...nextPlugin.coreWebVitals(),
  ...nextPlugin.typescript(),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
