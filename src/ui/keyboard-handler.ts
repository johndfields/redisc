import blessed from 'blessed';

export interface KeyboardHandlers {
  onSearch: () => void;
  onPattern: () => void;
  onHelp: () => void;
  onRefresh: () => Promise<void>;
  onQuit: () => Promise<void>;
  onToggleTree: () => void;
}

/**
 * Sets up global keyboard shortcuts
 * Lines 596-614 from original
 */
export function setupKeyboardHandlers(
  screen: blessed.Widgets.Screen,
  handlers: KeyboardHandlers
): void {
  // Quit handlers
  screen.key(['q', 'C-c'], async () => {
    await handlers.onQuit();
  });

  // Search handler
  screen.key('/', () => {
    handlers.onSearch();
  });

  // Pattern handler
  screen.key('p', () => {
    handlers.onPattern();
  });

  // Help handler
  screen.key('?', () => {
    handlers.onHelp();
  });

  // Refresh handler
  screen.key('r', async () => {
    await handlers.onRefresh();
  });

  // Toggle tree view handler
  screen.key('C-t', () => {
    handlers.onToggleTree();
  });
}
