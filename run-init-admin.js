#!/usr/bin/env node

/**
 * Helper script to run the init-admin.ts TypeScript file with ts-node
 * Works around issues with ES modules vs CommonJS modules
 */

const { execSync } = require('child_process');
const path = require('path');

// Collect command line arguments to pass through
const args = process.argv.slice(2).join(' ');

try {
  // Run the init-admin.ts file with ts-node
  execSync(`npx ts-node src/scripts/init-admin.ts ${args}`, {
    stdio: 'inherit'
  });
} catch (error) {
  process.exit(1);
} 