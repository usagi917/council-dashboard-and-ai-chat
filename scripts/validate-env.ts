#!/usr/bin/env node

/**
 * Environment validation CLI script for CI/CD
 */

import {
  validateEnvironmentSecrets,
  validateCIEnvironment,
  getEnvironmentSummary,
} from "../src/utils/env-validation";

function main() {
  console.log("🔐 Environment Validation");
  console.log("========================");

  const summary = getEnvironmentSummary();
  console.log(`Environment: ${summary.environment}`);
  console.log(`CI Mode: ${summary.isCI}`);
  console.log(
    `Secrets: ${summary.secretCount}/${summary.totalRequiredSecrets}`
  );

  if (summary.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    summary.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }

  const secrets = validateEnvironmentSecrets();
  const ci = validateCIEnvironment();

  if (!secrets.isValid) {
    console.error("\n❌ Missing required secrets:");
    secrets.missingSecrets.forEach((secret) => console.error(`  - ${secret}`));
  }

  if (ci.isCI && !ci.hasRequiredCISecrets) {
    console.error("\n❌ Missing required CI secrets:");
    ci.missingCISecrets.forEach((secret) => console.error(`  - ${secret}`));
  }

  if (ci.secretLeakageRisk) {
    console.error("\n⚠️  Potential secret leakage detected!");
  }

  const isValid =
    secrets.isValid && ci.hasRequiredCISecrets && !ci.secretLeakageRisk;

  if (isValid) {
    console.log("\n✅ All environment validations passed");
  } else {
    console.error("\n❌ Environment validation failed");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
