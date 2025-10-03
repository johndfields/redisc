import blessed from 'blessed';

export interface SearchBoxWidget {
  widget: blessed.Widgets.TextboxElement;
  show(): void;
}

/**
 * Creates the search input textbox
 * Lines 497-515, 569-586, 356-361 from original
 */
export function createSearchBox(
  screen: blessed.Widgets.Screen,
  onSearch: (value: string) => void,
  onCancel: () => void
): SearchBoxWidget {
  const widget = blessed.textbox({
    parent: screen,
    label: ' Search Keys (Esc to cancel) ',
    top: 'center',
    left: 'center',
    width: '50%',
    height: 3,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'yellow'
      }
    },
    hidden: true,
    inputOnFocus: true
  });

  // Handle submit event
  widget.on('submit', (value) => {
    onSearch(value || '');
    widget.hide();
  });

  // Handle cancel event
  widget.on('cancel', () => {
    onCancel();
    widget.hide();
  });

  // Handle escape key
  widget.key('escape', () => {
    onCancel();
    widget.hide();
  });

  const show = (): void => {
    widget.show();
    widget.focus();
    widget.setValue('');
    screen.render();
  };

  return { widget, show };
}
