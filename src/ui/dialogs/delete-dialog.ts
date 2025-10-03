import blessed from 'blessed';

/**
 * Shows a confirmation dialog before deleting a key
 * Fixed implementation using custom textbox to avoid blessed.question issues
 */
export function showDeleteDialog(
  screen: blessed.Widgets.Screen,
  key: string,
  onConfirm: () => Promise<void>,
  onCancel: () => void
): void {
  // Create container box
  const container = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '70%',
    height: 13,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'red',
        bold: true
      }
    },
    label: ' {red-fg}{bold}DELETE CONFIRMATION{/bold}{/red-fg} ',
    tags: true,
    padding: {
      left: 2,
      right: 2,
      top: 1,
      bottom: 1
    }
  });

  // Warning message
  const message = blessed.text({
    parent: container,
    top: 0,
    left: 0,
    width: '100%',
    height: 5,
    content: `{center}{bold}⚠ WARNING ⚠{/bold}{/center}\n\n` +
             `Key: {yellow-fg}${key}{/yellow-fg}\n\n` +
             `{red-fg}This action CANNOT be undone!{/red-fg}`,
    tags: true
  });

  // Prompt text
  const promptLabel = blessed.text({
    parent: container,
    top: 6,
    left: 0,
    content: "Type 'yes' to confirm deletion:",
    tags: true
  });

  // Input textbox
  const input = blessed.textbox({
    parent: container,
    top: 7,
    left: 0,
    width: '100%',
    height: 1,
    inputOnFocus: true,
    keys: true,
    mouse: true,
    style: {
      fg: 'white',
      bg: 'black',
      focus: {
        fg: 'black',
        bg: 'white'
      }
    }
  });

  // Cancel text hint
  const cancelHint = blessed.text({
    parent: container,
    top: 9,
    left: 0,
    content: '{gray-fg}(Press Escape to cancel){/gray-fg}',
    tags: true
  });

  // Handle submission (Enter key)
  input.on('submit', async (value) => {
    container.destroy();
    screen.render();
    
    if (value && value.trim().toLowerCase() === 'yes') {
      await onConfirm();
    } else {
      onCancel();
    }
  });

  // Handle cancel (Escape key)
  input.key('escape', () => {
    container.destroy();
    onCancel();
    screen.render();
  });

  // Bring to front and focus
  container.setFront();
  input.focus();
  screen.render();
}
