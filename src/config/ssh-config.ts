import { readFileSync } from 'fs';

/**
 * SSH tunnel configuration
 */
export interface SSHConfig {
  /** SSH host */
  host: string;
  /** SSH port */
  port: number;
  /** SSH username */
  username: string;
  /** SSH private key contents (if using key auth) */
  privateKey?: Buffer;
  /** SSH private key passphrase (if set) */
  passphrase?: string;
  /** SSH password (if using password auth) */
  password?: string;
}

/**
 * Get SSH tunnel configuration from environment variables
 * Returns null if SSH is not enabled
 * 
 * @returns SSH configuration or null if USE_SSH is not 'true'
 */
export function getSSHConfig(): SSHConfig | null {
  const useSSH = process.env.USE_SSH === 'true';
  
  if (!useSSH) {
    return null;
  }

  const config: SSHConfig = {
    host: process.env.SSH_HOST!,
    port: parseInt(process.env.SSH_PORT || '22'),
    username: process.env.SSH_USERNAME!,
    privateKey: process.env.SSH_PRIVATE_KEY_PATH ? readFileSync(process.env.SSH_PRIVATE_KEY_PATH) : undefined,
    passphrase: process.env.SSH_PASSPHRASE || undefined,
    password: process.env.SSH_PASSWORD || undefined
  };

  return config;
}
