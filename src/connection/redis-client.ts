import { createClient, type RedisClientType } from 'redis';
import { createSSHTunnel, type SSHTunnelResult, type StatusCallback } from './ssh-tunnel.js';
import type { RedisConfig } from '../config/redis-config.js';
import type { SSHConfig } from '../config/ssh-config.js';

/**
 * Redis connection result
 */
export interface RedisConnectionResult {
  /** Connected Redis client */
  client: ReturnType<typeof createClient>;
  /** Cleanup function to close Redis and SSH tunnel */
  cleanup: () => Promise<void>;
}

/**
 * Connect to Redis, optionally through an SSH tunnel
 * 
 * @param redisConfig - Redis configuration
 * @param sshConfig - SSH configuration (null for direct connection)
 * @param statusCallback - Optional callback for status updates
 * @returns Redis client and cleanup function
 */
export async function connectRedis(
  redisConfig: RedisConfig,
  sshConfig: SSHConfig | null,
  statusCallback?: StatusCallback
): Promise<RedisConnectionResult> {
  let redisHost = redisConfig.host;
  let redisPort = redisConfig.port;
  let sshTunnel: SSHTunnelResult | null = null;

  // Set up SSH tunnel if configured
  if (sshConfig) {
    sshTunnel = await createSSHTunnel(sshConfig, redisConfig, statusCallback);
    redisHost = sshTunnel.host;
    redisPort = sshTunnel.port;
  }

  // Connect to Redis (either directly or through SSH tunnel)
  const config: any = {
    socket: {
      host: redisHost,
      port: redisPort
    }
  };

  if (redisConfig.password) {
    config.password = redisConfig.password;
  }

  if (redisConfig.database) {
    config.database = redisConfig.database;
  }

  const client = createClient(config);

  client.on('error', (err) => {
    console.error('Redis Client Error', err);
    process.exit(1);
  });

  await client.connect();

  // Return client and cleanup function
  return {
    client,
    cleanup: async () => {
      await client.quit();
      if (sshTunnel) {
        sshTunnel.cleanup();
      }
    }
  };
}
