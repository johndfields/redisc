import { createTunnel } from 'tunnel-ssh';
import type { SSHConfig } from '../config/ssh-config.js';
import type { RedisConfig } from '../config/redis-config.js';
import type { Server } from 'net';
import type { Client } from 'ssh2';

/**
 * SSH tunnel connection result
 */
export interface SSHTunnelResult {
  /** Local host to connect to (always 127.0.0.1) */
  host: string;
  /** Local port that was assigned */
  port: number;
  /** Cleanup function to close the tunnel */
  cleanup: () => void;
}

/**
 * Status callback for reporting tunnel establishment progress
 */
export type StatusCallback = (message: string) => void;

/**
 * Create an SSH tunnel for Redis connection
 * 
 * @param sshConfig - SSH configuration
 * @param redisConfig - Redis configuration (for destination host/port)
 * @param statusCallback - Optional callback for status updates
 * @returns SSH tunnel connection details
 */
export async function createSSHTunnel(
  sshConfig: SSHConfig,
  redisConfig: RedisConfig,
  statusCallback?: StatusCallback
): Promise<SSHTunnelResult> {
  try {
    statusCallback?.('Establishing SSH tunnel...');

    const tunnelOptions = {
      autoClose: true,
      reconnectOnError: false
    };

    const serverOptions = {
      port: 0 // Let the system assign a free port
    };

    const sshOptions: any = {
      host: sshConfig.host,
      port: sshConfig.port,
      username: sshConfig.username
    };

    // Add authentication method
    if (sshConfig.privateKey) {
      sshOptions.privateKey = sshConfig.privateKey;
      if (sshConfig.passphrase) {
        sshOptions.passphrase = sshConfig.passphrase;
      }
    } else if (sshConfig.password) {
      sshOptions.password = sshConfig.password;
    }

    const forwardOptions = {
      srcAddr: '127.0.0.1',
      srcPort: 0,
      dstAddr: redisConfig.host,
      dstPort: redisConfig.port
    };

    const [server, conn]: [Server, Client] = await createTunnel(
      tunnelOptions,
      serverOptions,
      sshOptions,
      forwardOptions
    );

    // Get the local port that was assigned
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to get server address');
    }

    const localPort = address.port;

    statusCallback?.('SSH tunnel established, connecting to Redis...');

    return {
      host: '127.0.0.1',
      port: localPort,
      cleanup: () => {
        server.close();
        conn.end();
      }
    };
  } catch (err) {
    const error = err as Error;
    throw new Error(`SSH tunnel failed: ${error.message}`);
  }
}
