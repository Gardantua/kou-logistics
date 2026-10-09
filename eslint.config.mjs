import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
export default defineConfig([
  ...nextVitals,
  // Keep legacy hydration effects visible as warnings during the framework migration.
  { rules: { "react-hooks/set-state-in-effect": "warn" } },
  globalIgnores([".next/**", "node_modules/**"]),
]);
