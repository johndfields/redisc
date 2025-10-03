import blessed from 'blessed';

/**
 * Shows a dialog for entering Redis scan patterns
 * Lines 363-389 from original
 */
export function showPatternDialog(
  screen: blessed.Widgets.Screen,
  currentPattern: string,
  onSubmit: (pattern: string) => Promise<void>,
  onCancel: () => void
): void {
  const patternBox = blessed.prompt({
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
    },
    label: ' Enter Redis Pattern '
  });

  patternBox.input('Enter pattern (e.g., user:*, session:*)', currentPattern, async (err, value) => {
    if (value) {
      await onSubmit(value);
    } else {
      onCancel();
    }
    screen.render();
  });
}
