import blessed from 'blessed';

/**
 * Shows a confirmation dialog before deleting a key
 * Lines 309-354 from original
 */
export function showDeleteDialog(
  screen: blessed.Widgets.Screen,
  key: string,
  onConfirm: () => Promise<void>,
  onCancel: () => void
): void {
  const confirmBox = blessed.question({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '60%',
    height: 'shrink',
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'red',
        bold: true
      },
      focus: {
        border: {
          fg: 'red'
        }
      }
    },
    tags: true
  });

  const message = `{red-fg}{bold}⚠ DELETE CONFIRMATION ⚠{/bold}{/red-fg}\n\nKey: {yellow-fg}${key}{/yellow-fg}\n\n{red-fg}This action CANNOT be undone!{/red-fg}\n\nType 'yes' to confirm deletion:`;

  confirmBox.ask(message, async (err, value) => {
    const confirmed = value && value.trim().toLowerCase() === 'yes';
    
    if (confirmed) {
      await onConfirm();
    } else {
      onCancel();
    }
  });
}
