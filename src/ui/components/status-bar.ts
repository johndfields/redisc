import blessed from 'blessed';

export interface StatusBarWidget {
  widget: blessed.Widgets.BoxElement;
  update(envFile: string, allCount: number, filteredCount: number): void;
}

/**
 * Creates the status bar widget at the bottom of the screen
 * Lines 541-552, 214-220 from original
 */
export function createStatusBar(screen: blessed.Widgets.Screen): StatusBarWidget {
  const widget = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    style: {
      fg: 'white',
      bg: 'blue'
    },
    content: ' Connecting to Redis...'
  });

  const update = (envFile: string, allCount: number, filteredCount: number): void => {
    const envName = envFile === '.env' ? 'default' : envFile.replace('.env.', '');
    const showing = filteredCount !== allCount 
      ? `Showing: ${filteredCount}/${allCount}` 
      : `Keys: ${allCount}`;
    
    widget.setContent(
      ` [${envName.toUpperCase()}] | ${showing} | /: Search | p: Pattern | d: Delete | t: TTL | r: Refresh | ?: Help | q: Quit`
    );
  };

  return { widget, update };
}
