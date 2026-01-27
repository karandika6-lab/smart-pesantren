import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules to reduce noise from legacy any usage
  {
    rules: {
      // Downgrade to warnings for gradual migration
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      // Allow empty interfaces for type augmentation
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow unused eslint-disable directives (cleanup later)
      "no-unused-disable-directives": "off",
      // Disable strict React Compiler purity checks for legacy code
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    }
  },
  // Disable React Compiler rules that are too strict for this codebase
  {
    files: ["**/*.tsx", "**/*.ts"],
    rules: {
      "react-compiler/react-compiler": "off",
    }
  }
]);

export default eslintConfig;
