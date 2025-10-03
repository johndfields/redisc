/**
 * Redis configuration
 */
export interface RedisConfig {
  /** Redis host */
  host: string;
  /** Redis port */
  port: number;
  /** Redis password (if set) */
  password?: string;
  /** Redis database number */
  database: number;
}

/**
 * Get Redis configuration from environment variables
 * 
 * @returns Redis configuration
 */
export function getRedisConfig(): RedisConfig {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB || '0')
  };
}
