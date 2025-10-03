/**
 * TTL information
 */
export interface TTLInfo {
  /** Raw TTL value in seconds (-1 = no expiration, -2 = key doesn't exist) */
  rawTTL: number;
  /** Human-readable TTL display */
  display: string;
  /** Whether the key has an expiration */
  hasExpiration: boolean;
  /** Whether the key exists */
  exists: boolean;
}

/**
 * Format TTL value to human-readable string
 * 
 * @param ttl - TTL in seconds (-1 = no expiration, -2 = key doesn't exist)
 * @returns TTL information
 */
export function formatTTL(ttl: number): TTLInfo {
  if (ttl === -1) {
    return {
      rawTTL: ttl,
      display: 'No expiration',
      hasExpiration: false,
      exists: true
    };
  } else if (ttl === -2) {
    return {
      rawTTL: ttl,
      display: 'Key does not exist',
      hasExpiration: false,
      exists: false
    };
  } else {
    const hours = Math.floor(ttl / 3600);
    const minutes = Math.floor((ttl % 3600) / 60);
    const seconds = ttl % 60;
    return {
      rawTTL: ttl,
      display: `${hours}h ${minutes}m ${seconds}s`,
      hasExpiration: true,
      exists: true
    };
  }
}

/**
 * Format TTL details for display (includes both seconds and formatted time)
 * 
 * @param ttl - TTL in seconds
 * @returns Formatted TTL details
 */
export function formatTTLDetails(ttl: number): string {
  const info = formatTTL(ttl);
  
  if (!info.exists) {
    return info.display;
  }
  
  if (!info.hasExpiration) {
    return info.display;
  }
  
  return `${ttl} seconds\n(${info.display})`;
}
