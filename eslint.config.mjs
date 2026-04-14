import { fixupConfigRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  ...fixupConfigRules(compat.extends("next/core-web-vitals")),
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**"],
  },
];

export default config;

