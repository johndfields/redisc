import type { RedisClientType } from 'redis';
import { formatTTL } from '../utils/formatters.js';

/**
 * Get key information including type, TTL, and formatted value
 * 
 * @param client - Connected Redis client
 * @param key - Redis key to fetch
 * @returns Formatted string with key information
 */
export async function getKeyInfo(client: RedisClientType<any, any, any>, key: string): Promise<string> {
  try {
    const type = await client.type(key);
    const ttl = await client.ttl(key);
    const ttlInfo = formatTTL(ttl);
    const ttlDisplay = ttlInfo.display;

    let value: any;
    let display: string;

    switch (type) {
      case 'string':
        value = await client.get(key);
        display = `Type: STRING | TTL: ${ttlDisplay}\n\n${value}`;
        break;
      
      case 'list':
        value = await client.lRange(key, 0, -1);
        display = `Type: LIST (${value.length} items) | TTL: ${ttlDisplay}\n\n${value.map((v: string, i: number) => `[${i}] ${v}`).join('\n')}`;
        break;
      
      case 'set':
        value = await client.sMembers(key);
        display = `Type: SET (${value.length} members) | TTL: ${ttlDisplay}\n\n${value.join('\n')}`;
        break;
      
      case 'zset':
        value = await client.zRangeWithScores(key, 0, -1);
        display = `Type: SORTED SET (${value.length} members) | TTL: ${ttlDisplay}\n\n${value.map((v: any) => `${v.score}: ${v.value}`).join('\n')}`;
        break;
      
      case 'hash':
        value = await client.hGetAll(key);
        display = `Type: HASH (${Object.keys(value).length} fields) | TTL: ${ttlDisplay}\n\n${Object.entries(value).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
        break;
      
      default:
        display = `Type: ${type.toUpperCase()} | TTL: ${ttlDisplay}\n\nUnsupported type`;
    }

    return display;
  } catch (err) {
    const error = err as Error;
    return `Error fetching value: ${error.message}`;
  }
}
