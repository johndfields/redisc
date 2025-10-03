import blessed from 'blessed';

export interface KeyListWidget {
  widget: blessed.Widgets.ListElement;
  updateItems(keys: string[]): void;
}

/**
 * Creates the key list widget on the left side of the screen
 * Lines 437-466 from original
 */
export function createKeyList(screen: blessed.Widgets.Screen): KeyListWidget {
  const widget = blessed.list({
    parent: screen,
    label: ' Redis Keys ',
    top: 0,
    left: 0,
    width: '40%',
    height: '100%-1',
    border: {
      type: 'line'
    },
    style: {
      selected: {
        bg: 'blue',
        fg: 'white'
      },
      border: {
        fg: 'cyan'
      }
    },
    keys: true,
    vi: true,
    mouse: true,
    scrollbar: {
      ch: '█',
      style: {
        fg: 'cyan'
      }
    }
  });

  const updateItems = (keys: string[]): void => {
    widget.setItems(keys);
  };

  return { widget, updateItems };
}
