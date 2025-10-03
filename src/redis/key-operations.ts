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

/**
 * Delete multiple Redis keys
 * 
 * @param client - Connected Redis client
 * @param keys - Array of Redis keys to delete
 * @returns Number of keys deleted
 */
export async function deleteKeys(client: FlexibleRedisClient, keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  return await client.del(keys);
}

/**
 * Delete multiple Redis keys in batches to avoid overwhelming Redis
 * 
 * @param client - Connected Redis client
 * @param keys - Array of Redis keys to delete
 * @param batchSize - Number of keys to delete per batch (default: 500)
 * @param onProgress - Optional callback for progress updates
 * @returns Total number of keys deleted
 */
export async function deleteKeysInBatches(
  client: FlexibleRedisClient,
  keys: string[],
  batchSize: number = 500,
  onProgress?: (deleted: number, total: number) => void
): Promise<number> {
  if (keys.length === 0) return 0;
  
  let totalDeleted = 0;
  
  // Process in batches
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, Math.min(i + batchSize, keys.length));
    const deleted = await client.del(batch);
    totalDeleted += deleted;
    
    // Report progress if callback provided
    if (onProgress) {
      onProgress(totalDeleted, keys.length);
    }
  }
  
  return totalDeleted;
}
