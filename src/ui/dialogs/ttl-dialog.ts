import blessed from 'blessed';
import type { RedisClientType } from 'redis';
import { getTTLMessage } from '../../redis/key-operations.js';

// Use a flexible type for Redis client to avoid version conflicts
type FlexibleRedisClient = RedisClientType<any, any, any>;

/**
 * Shows a dialog displaying TTL information for a key
 * Lines 273-307 from original
 */
export async function showTTLDialog(
  screen: blessed.Widgets.Screen,
  client: FlexibleRedisClient,
  key: string,
  onClose: () => void
): Promise<void> {
  const message = await getTTLMessage(client, key);

  const box = blessed.message({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: 'shrink',
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    }
  });

  box.display(message, 0, () => {
    onClose();
  });
}
