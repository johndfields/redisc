import blessed from 'blessed';

/**
 * Shows a confirmation dialog for bulk deleting keys under a folder
 */
export function showBulkDeleteDialog(
  screen: blessed.Widgets.Screen,
  folderPath: string,
  keyCount: number,
  onConfirm: () => Promise<void>,
  onCancel: () => void
): void {
  const dialog = blessed.box({
    parent: screen,
    label: ' Bulk Delete Confirmation ',
    top: 'center',
    left: 'center',
    width: '60%',
    height: 10,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'red'
      }
    },
    content: `\n  Delete ALL keys under this folder?\n\n  Folder: ${folderPath}\n  Pattern: ${folderPath}:*\n  Keys to delete: ${keyCount}\n\n  Press 'y' to confirm, 'n' or ESC to cancel`,
    tags: true
  });

  const handleKey = async (ch: string) => {
    if (ch === 'y' || ch === 'Y') {
      dialog.destroy();
      await onConfirm();
    } else if (ch === 'n' || ch === 'N' || ch === 'escape') {
      dialog.destroy();
      onCancel();
    }
  };

  dialog.key(['y', 'Y', 'n', 'N', 'escape'], handleKey);
  dialog.focus();
  screen.render();
}
