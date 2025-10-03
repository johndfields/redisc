import blessed from 'blessed';

/**
 * Generate content for bulk delete dialog with safety warnings
 */
function getBulkDeleteContent(folderPath: string, delimiter: string, keyCount: number): string {
  const warning = keyCount > 1000 
    ? `\n  {red-fg}⚠ WARNING: This will delete ${keyCount} keys!{/red-fg}`
    : '';
  
  return `\n  Delete ALL keys under this folder?${warning}\n\n  Folder: ${folderPath}\n  Pattern: ${folderPath}${delimiter}*\n  Keys to delete: ${keyCount}\n\n  Press 'y' to confirm, 'n' or ESC to cancel`;
}

/**
 * Shows a confirmation dialog for bulk deleting keys under a folder
 */
export function showBulkDeleteDialog(
  screen: blessed.Widgets.Screen,
  folderPath: string,
  keyCount: number,
  delimiter: string,
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
    content: getBulkDeleteContent(folderPath, delimiter, keyCount),
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
