import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Environment configuration result
 */
export interface EnvironmentConfig {
  /** Name of the .env file (e.g., '.env' or '.env.staging') */
  envFile: string;
  /** Full path to the .env file */
  envPath: string;
  /** Whether to run connection test mode */
  shouldTestConnection: boolean;
}

/**
 * Load environment configuration from .env files
 * Supports --env flag to load specific .env files (e.g., .env.staging)
 * Supports --test-conn flag for connection testing mode
 * 
 * @returns Environment configuration
 */
export function loadEnvironment(): EnvironmentConfig {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const envIndex = args.indexOf('--env');
  const shouldTestConnection = args.includes('--test-conn');
  let envFile = '.env';

  if (envIndex !== -1 && args[envIndex + 1]) {
    const envName = args[envIndex + 1];
    envFile = `.env.${envName}`;
  }

  // Resolve path relative to project root (3 levels up from this file)
  const projectRoot = join(__dirname, '..', '..');
  const envPath = join(projectRoot, envFile);

  if (!existsSync(envPath)) {
    console.error(`Error: Environment file '${envFile}' not found at ${envPath}`);
    console.error('\nAvailable options:');
    console.error('  node redis-browser.js              (uses .env)');
    console.error('  node redis-browser.js --env staging   (uses .env.staging)');
    console.error('  node redis-browser.js --env production (uses .env.production)');
    process.exit(1);
  }

  // Load environment variables from specified .env file
  dotenv.config({ path: envPath });

  console.log(`Loading configuration from: ${envFile}`);

  return {
    envFile,
    envPath,
    shouldTestConnection
  };
}
