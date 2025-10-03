import blessed from 'blessed';

export interface HelpBoxWidget {
  widget: blessed.Widgets.BoxElement;
  show(): void;
}

/**
 * Gets the help text content
 * Lines 391-427 from original
 */
function getHelpText(): string {
  return `
  REDIS CLI BROWSER - HELP
  
  Navigation:
    ↑/↓ or j/k      Navigate key list
    Enter           View selected key value
    Mouse           Click and scroll
  
  Search & Filter:
    /               Search keys (filter current list)
    p               Pattern match (reload with Redis pattern)
    Esc             Clear search/close dialogs
  
  Actions:
    d               Delete selected key (with confirmation)
    t               Show TTL for selected key
    r               Refresh key list
    (^t)            Toggle tree view mode
  
  Tree View (^t):
    Enter/Space     Toggle expand/collapse folder
    →               Expand selected folder
    ←               Collapse selected folder
    d/t             Delete/TTL on selected key (not folders)
  
  Redis Patterns (for 'p' command):
    *               Match any characters
    ?               Match single character
    user:*          Match keys starting with 'user:'
    *:session       Match keys ending with ':session'
    user:?:*        Match 'user:' + 1 char + anything
  
  Other:
    ?               Show this help
    q or Ctrl-C     Quit application
  
  Press any key to close...`;
}

/**
 * Creates the help dialog box
 * Lines 517-538, 588-593 from original
 */
export function createHelpBox(
  screen: blessed.Widgets.Screen,
  onClose: () => void
): HelpBoxWidget {
  const widget = blessed.box({
    parent: screen,
    label: ' Help ',
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'green'
      }
    },
    hidden: true,
    scrollable: true,
    keys: true,
    vi: true,
    mouse: true
  });

  // Handle close keys
  widget.key(['escape', 'q', 'enter', 'space'], () => {
    widget.hide();
    onClose();
    screen.render();
  });

  const show = (): void => {
    widget.setContent(getHelpText());
    widget.show();
    widget.focus();
    screen.render();
  };

  return { widget, show };
}
