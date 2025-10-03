import type { RedisClientType } from 'redis';

/**
 * Manages Redis keys - loading, filtering, and pattern matching
 */
export class KeyManager {
  private allKeys: string[] = [];
  private filteredKeys: string[] = [];
  private currentPattern: string = '*';
  private currentSearchTerm: string = '';
  private treeMode: boolean = false;

  constructor(private client: RedisClientType<any, any, any>) {}

  /**
   * Load keys from Redis using SCAN with a pattern
   * 
   * @param pattern - Redis pattern (e.g., 'user:*', '*:session')
   * @returns Array of keys matching the pattern
   */
  async loadKeys(pattern: string = '*'): Promise<string[]> {
    this.currentPattern = pattern;
    const keys: string[] = [];
    let cursor = 0;

    do {
      const result = await this.client.scan(cursor.toString(), {
        MATCH: pattern,
        COUNT: 100
      });
      cursor = parseInt(result.cursor);
      keys.push(...result.keys);
    } while (cursor !== 0);

    this.allKeys = keys.sort();
    
    // Reapply search filter if one exists
    if (this.currentSearchTerm) {
      this.filterKeys(this.currentSearchTerm);
    } else {
      this.filteredKeys = this.allKeys;
    }

    return this.filteredKeys;
  }

  /**
   * Filter currently loaded keys by search term (client-side filtering)
   * 
   * @param searchTerm - Search term to filter keys
   * @returns Array of filtered keys
   */
  filterKeys(searchTerm: string): string[] {
    this.currentSearchTerm = searchTerm;

    if (!searchTerm || searchTerm === '') {
      this.filteredKeys = this.allKeys;
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      this.filteredKeys = this.allKeys.filter(key =>
        key.toLowerCase().includes(lowerSearch)
      );
    }

    return this.filteredKeys;
  }

  /**
   * Clear the search filter
   * 
   * @returns Array of all keys
   */
  clearFilter(): string[] {
    this.currentSearchTerm = '';
    this.filteredKeys = this.allKeys;
    return this.filteredKeys;
  }

  /**
   * Get all keys (unfiltered)
   * 
   * @returns Array of all keys
   */
  getAllKeys(): string[] {
    return this.allKeys;
  }

  /**
   * Get filtered keys
   * 
   * @returns Array of filtered keys
   */
  getFilteredKeys(): string[] {
    return this.filteredKeys;
  }

  /**
   * Get current pattern
   * 
   * @returns Current Redis pattern
   */
  getCurrentPattern(): string {
    return this.currentPattern;
  }

  /**
   * Get current search term
   * 
   * @returns Current search term
   */
  getCurrentSearchTerm(): string {
    return this.currentSearchTerm;
  }

  /**
   * Get key counts
   * 
   * @returns Object with total and filtered key counts
   */
  getCounts(): { total: number; filtered: number; isFiltered: boolean } {
    return {
      total: this.allKeys.length,
      filtered: this.filteredKeys.length,
      isFiltered: this.filteredKeys.length !== this.allKeys.length
    };
  }

  /**
   * Remove a key from local cache (after deletion)
   * This provides instant UI feedback without reloading from Redis
   * 
   * @param key - Key to remove from local cache
   */
  removeKey(key: string): void {
    this.allKeys = this.allKeys.filter(k => k !== key);
    this.filteredKeys = this.filteredKeys.filter(k => k !== key);
  }

  /**
   * Enable tree view mode
   */
  enableTreeMode(): void {
    this.treeMode = true;
  }

  /**
   * Disable tree view mode
   */
  disableTreeMode(): void {
    this.treeMode = false;
  }

  /**
   * Toggle tree view mode
   * 
   * @returns New state of tree mode
   */
  toggleTreeMode(): boolean {
    this.treeMode = !this.treeMode;
    return this.treeMode;
  }

  /**
   * Check if tree mode is enabled
   * 
   * @returns True if tree mode is enabled
   */
  isTreeMode(): boolean {
    return this.treeMode;
  }
}
