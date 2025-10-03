import blessed from 'blessed';

export interface ValueDisplayWidget {
  widget: blessed.Widgets.BoxElement;
  setValue(label: string, content: string): void;
  setLoading(): void;
}

/**
 * Creates the value display box on the right side of the screen
 * Lines 468-495 from original
 */
export function createValueDisplay(screen: blessed.Widgets.Screen): ValueDisplayWidget {
  const widget = blessed.box({
    parent: screen,
    label: ' Value ',
    top: 0,
    left: '40%',
    width: '60%',
    height: '100%-1',
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    },
    scrollable: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollbar: {
      ch: '█',
      style: {
        fg: 'cyan'
      }
    },
    content: 'Select a key to view its value'
  });

  const setValue = (label: string, content: string): void => {
    widget.setLabel(` Value: ${label} `);
    widget.setContent(content);
  };

  const setLoading = (): void => {
    widget.setContent('Loading...');
  };

  return { widget, setValue, setLoading };
}
