#!/usr/bin/env node
/**
 * Redis CLI Browser - Main Entry Point
 * Modular refactored version
 */

import type { RedisClientType } from 'redis';
import { loadEnvironment } from './src/config/environment.js';
import { getRedisConfig } from './src/config/redis-config.js';
import { getSSHConfig } from './src/config/ssh-config.js';
import { connectRedis } from './src/connection/redis-client.js';
import { testConnection } from './src/connection/connection-tester.js';
import { KeyManager } from './src/redis/key-manager.js';
import { getKeyInfo } from './src/redis/value-fetcher.js';
import { deleteKey, deleteKeys } from './src/redis/key-operations.js';
import { createScreen } from './src/ui/screen-manager.js';
import { createStatusBar } from './src/ui/components/status-bar.js';
import { createKeyList } from './src/ui/components/key-list.js';
import { createTreeKeyList } from './src/ui/components/tree-key-list.js';
import { createValueDisplay } from './src/ui/components/value-display.js';
import { createSearchBox } from './src/ui/components/search-box.js';
import { createHelpBox } from './src/ui/components/help-box.js';
import { showTTLDialog } from './src/ui/dialogs/ttl-dialog.js';
import { showDeleteDialog } from './src/ui/dialogs/delete-dialog.js';
import { showBulkDeleteDialog } from './src/ui/dialogs/bulk-delete-dialog.js';
import { showPatternDialog } from './src/ui/dialogs/pattern-dialog.js';
import { setupKeyboardHandlers } from './src/ui/keyboard-handler.js';
import { setupCleanup } from './src/utils/lifecycle.js';
import { displayBanner } from './src/utils/banner.js';
import { getAllKeysUnderNode } from './src/utils/tree-builder.js';

async function main() {
  // Load configuration
  const envConfig = loadEnvironment();
  const redisConfig = getRedisConfig();
  const sshConfig = getSSHConfig();

  // If test connection flag is present, run test and exit
  if (envConfig.shouldTestConnection) {
    await testConnection(envConfig.envFile, redisConfig, sshConfig);
    return;
  }

  // Display banner before starting UI
  displayBanner();
  
  // Initialize UI
  const screen = createScreen(envConfig.envFile);
  const statusBar = createStatusBar(screen);
  const keyListWidget = createKeyList(screen);
  const treeKeyListWidget = createTreeKeyList(screen);
  const valueDisplay = createValueDisplay(screen);

  // Initially hide tree view
  treeKeyListWidget.widget.hide();

  // Connect to Redis
  statusBar.widget.setContent(' Connecting to Redis...');
  screen.render();

  const { client, cleanup: redisCleanup } = await connectRedis(
    redisConfig,
    sshConfig,
    (message) => {
      statusBar.widget.setContent(` ${message}`);
      screen.render();
    }
  );

  // Initialize key manager
  const keyManager = new KeyManager(client as any);
  let currentPattern = '*';

  // Update UI helper functions
  const updateStatusBar = () => {
    const counts = keyManager.getCounts();
    statusBar.update(envConfig.envFile, counts.total, counts.filtered);
  };

  const updateKeyList = () => {
    const filteredKeys = keyManager.getFilteredKeys();
    if (keyManager.isTreeMode()) {
      treeKeyListWidget.updateItems(filteredKeys);
    } else {
      keyListWidget.updateItems(filteredKeys);
    }
    screen.render();
  };

  const loadKeys = async (pattern: string = '*') => {
    try {
      statusBar.widget.setContent(' Loading keys...');
      screen.render();

      currentPattern = pattern;
      await keyManager.loadKeys(pattern);
      updateKeyList();
      updateStatusBar();
      screen.render();
    } catch (err: any) {
      statusBar.widget.setContent(` Error loading keys: ${err.message}`);
      screen.render();
    }
  };

  // Load initial keys
  await loadKeys();

  // Key selection handler for list view
  keyListWidget.widget.on('select', async (item) => {
    const key = item.getText();
    if (!key) return;

    valueDisplay.setLoading();
    screen.render();

    const value = await getKeyInfo(client as any, key);
    valueDisplay.setValue(key, value);
    screen.render();
  });

  // Key selection handler for tree view
  treeKeyListWidget.widget.on('select', async () => {
    const key = treeKeyListWidget.getSelectedKey();
    if (!key) return;

    valueDisplay.setLoading();
    screen.render();

    const value = await getKeyInfo(client as any, key);
    valueDisplay.setValue(key, value);
    screen.render();
  });

  // Search box
  const searchBox = createSearchBox(
    screen,
    (searchTerm: string) => {
      keyManager.filterKeys(searchTerm);
      updateKeyList();
      updateStatusBar();
      keyListWidget.widget.focus();
      screen.render();
    },
    () => {
      keyListWidget.widget.focus();
      screen.render();
    }
  );

  // Help box
  const helpBox = createHelpBox(screen, () => {
    keyListWidget.widget.focus();
  });

  // Setup global keyboard handlers
  const cleanup = setupCleanup([redisCleanup]);

  setupKeyboardHandlers(screen, {
    onSearch: () => searchBox.show(),
    onPattern: () => {
      showPatternDialog(
        screen,
        currentPattern,
        async (pattern: string) => {
          await loadKeys(pattern);
          const activeWidget = keyManager.isTreeMode() ? treeKeyListWidget.widget : keyListWidget.widget;
          activeWidget.focus();
        },
        () => {
          const activeWidget = keyManager.isTreeMode() ? treeKeyListWidget.widget : keyListWidget.widget;
          activeWidget.focus();
        }
      );
    },
    onHelp: () => helpBox.show(),
    onRefresh: async () => {
      await loadKeys(currentPattern);
    },
    onQuit: cleanup,
    onToggleTree: () => {
      keyManager.toggleTreeMode();
      
      if (keyManager.isTreeMode()) {
        // Switch to tree view
        keyListWidget.widget.hide();
        treeKeyListWidget.widget.show();
        treeKeyListWidget.widget.focus();
        updateKeyList();
      } else {
        // Switch to list view
        treeKeyListWidget.widget.hide();
        keyListWidget.widget.show();
        keyListWidget.widget.focus();
        updateKeyList();
      }
      
      screen.render();
    }
  });

  // Key-specific handlers (delete, TTL) for list view
  keyListWidget.widget.key('d', async () => {
    const selected = (keyListWidget.widget as any).selected;
    const filteredKeys = keyManager.getFilteredKeys();
    
    if (selected >= 0 && selected < filteredKeys.length) {
      const key = filteredKeys[selected];
      showDeleteDialog(
        screen,
        key,
        async () => {
          try {
            await deleteKey(client as any, key);
            
            // Remove key from local cache for instant UI update
            keyManager.removeKey(key);
            updateKeyList();
            updateStatusBar();
            
            // Show success message
            valueDisplay.widget.setContent(`{green-fg}✓ Key deleted successfully:{/green-fg} ${key}`);
            statusBar.widget.setContent(` Key deleted: ${key}`);
            
            keyListWidget.widget.focus();
            screen.render();
          } catch (err: any) {
            valueDisplay.widget.setContent(`{red-fg}✗ Error deleting key:{/red-fg} ${err.message}`);
            screen.render();
          }
        },
        () => {
          valueDisplay.widget.setContent('Delete cancelled');
          keyListWidget.widget.focus();
          screen.render();
        }
      );
    }
  });

  // Key-specific handlers (delete, TTL) for tree view
  treeKeyListWidget.widget.key('d', async () => {
    // Check if selected item is a folder or a key
    if (treeKeyListWidget.isSelectedItemFolder()) {
      // Folder deletion - bulk delete all keys under this path
      const folderPath = treeKeyListWidget.getSelectedFolderPath();
      const keyCount = treeKeyListWidget.getSelectedFolderKeyCount();
      
      if (!folderPath || keyCount === 0) return;
      
      showBulkDeleteDialog(
        screen,
        folderPath,
        keyCount,
        async () => {
          try {
            // Get all keys under this folder from the current filtered set
            const allFilteredKeys = keyManager.getFilteredKeys();
            const keysToDelete = allFilteredKeys.filter(k => k.startsWith(folderPath + ':'));
            
            if (keysToDelete.length === 0) {
              valueDisplay.widget.setContent(`{yellow-fg}No keys found to delete under: ${folderPath}{/yellow-fg}`);
              treeKeyListWidget.widget.focus();
              screen.render();
              return;
            }
            
            // Delete all keys
            await deleteKeys(client as any, keysToDelete);
            
            // Remove keys from local cache
            keysToDelete.forEach(key => keyManager.removeKey(key));
            updateKeyList();
            updateStatusBar();
            
            // Show success message
            valueDisplay.widget.setContent(`{green-fg}✓ Bulk delete successful:{/green-fg} ${keysToDelete.length} keys deleted from ${folderPath}`);
            statusBar.widget.setContent(` Bulk deleted: ${keysToDelete.length} keys from ${folderPath}`);
            
            treeKeyListWidget.widget.focus();
            screen.render();
          } catch (err: any) {
            valueDisplay.widget.setContent(`{red-fg}✗ Error during bulk delete:{/red-fg} ${err.message}`);
            screen.render();
          }
        },
        () => {
          valueDisplay.widget.setContent('Bulk delete cancelled');
          treeKeyListWidget.widget.focus();
          screen.render();
        }
      );
    } else {
      // Single key deletion
      const key = treeKeyListWidget.getSelectedKey();
      if (!key) return;
      
      showDeleteDialog(
        screen,
        key,
        async () => {
          try {
            await deleteKey(client as any, key);
            
            // Remove key from local cache for instant UI update
            keyManager.removeKey(key);
            updateKeyList();
            updateStatusBar();
            
            // Show success message
            valueDisplay.widget.setContent(`{green-fg}✓ Key deleted successfully:{/green-fg} ${key}`);
            statusBar.widget.setContent(` Key deleted: ${key}`);
            
            treeKeyListWidget.widget.focus();
            screen.render();
          } catch (err: any) {
            valueDisplay.widget.setContent(`{red-fg}✗ Error deleting key:{/red-fg} ${err.message}`);
            screen.render();
          }
        },
        () => {
          valueDisplay.widget.setContent('Delete cancelled');
          treeKeyListWidget.widget.focus();
          screen.render();
        }
      );
    }
  });

  keyListWidget.widget.key('t', async () => {
    const selected = (keyListWidget.widget as any).selected;
    const filteredKeys = keyManager.getFilteredKeys();
    
    if (selected >= 0 && selected < filteredKeys.length) {
      const key = filteredKeys[selected];
      await showTTLDialog(screen, client as any, key, () => {
        keyListWidget.widget.focus();
      });
    }
  });

  treeKeyListWidget.widget.key('t', async () => {
    const key = treeKeyListWidget.getSelectedKey();
    if (!key) return;
    
    await showTTLDialog(screen, client as any, key, () => {
      treeKeyListWidget.widget.focus();
    });
  });

  // Focus on key list and render
  keyListWidget.widget.focus();
  screen.render();
}

// Run the application
main().catch((err) => {
  console.error('Failed to start Redis Browser:', err);
  process.exit(1);
});
