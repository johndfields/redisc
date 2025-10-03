import type { RedisClientType } from 'redis';

// Use a flexible type for Redis client to avoid version conflicts
type FlexibleRedisClient = RedisClientType<any, any, any>;
import { formatTTL, formatTTLDetails, type TTLInfo } from '../utils/formatters.js';

/**
 * Get TTL information for a key
 * 
 * @param client - Connected Redis client
 * @param key - Redis key
 * @returns TTL information
 */
export async function getTTL(client: FlexibleRedisClient, key: string): Promise<TTLInfo> {
  const ttl = await client.ttl(key);
  return formatTTL(ttl);
}

/**
 * Get formatted TTL message for display
 * 
 * @param client - Connected Redis client
 * @param key - Redis key
 * @returns Formatted TTL message
 */
export async function getTTLMessage(client: FlexibleRedisClient, key: string): Promise<string> {
  const ttl = await client.ttl(key);
  const ttlInfo = formatTTL(ttl);
  
  if (!ttlInfo.exists) {
    return `Key: ${key}\n\nKey does not exist`;
  }
  
  if (!ttlInfo.hasExpiration) {
    return `Key: ${key}\n\nNo expiration set`;
  }
  
  return `Key: ${key}\n\nTTL: ${formatTTLDetails(ttl)}`;
}

/**
 * Delete a Redis key
 * 
 * @param client - Connected Redis client
 * @param key - Redis key to delete
 * @returns Number of keys deleted (0 or 1)
 */
export async function deleteKey(client: FlexibleRedisClient, key: string): Promise<number> {
  return await client.del(key);
}
