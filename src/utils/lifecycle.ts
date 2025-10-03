/**
 * Cleanup function type
 */
export type CleanupFunction = () => Promise<void>;

/**
 * Sets up cleanup handlers for graceful shutdown
 * Lines 785-796 from original
 */
export function setupCleanup(cleanupFunctions: CleanupFunction[]): () => Promise<void> {
  const cleanup = async (): Promise<void> => {
    for (const fn of cleanupFunctions) {
      try {
        await fn();
      } catch (err) {
        // Ignore errors during cleanup
        console.error('Cleanup error:', err);
      }
    }
    process.exit(0);
  };

  return cleanup;
}
