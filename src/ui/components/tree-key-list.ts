import blessed from 'blessed';
import { buildTree, flattenTree, toggleNode, type TreeNode, type FlatTreeItem } from '../../utils/tree-builder.js';

export interface TreeKeyListWidget {
  widget: blessed.Widgets.ListElement;
  updateItems(keys: string[]): void;
  getSelectedKey(): string | undefined;
  toggleCurrentNode(): void;
}

/**
 * Creates a tree-based key list widget
 * Shows keys in a hierarchical structure with expandable/collapsible nodes
 */
export function createTreeKeyList(screen: blessed.Widgets.Screen): TreeKeyListWidget {
  const widget = blessed.list({
    parent: screen,
    label: ' Redis Keys (Tree View) ',
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

  let treeRoot: TreeNode | null = null;
  let flatItems: FlatTreeItem[] = [];

  const updateItems = (keys: string[]): void => {
    // Build tree structure
    treeRoot = buildTree(keys);
    
    // Flatten to displayable list
    flatItems = flattenTree(treeRoot);
    
    // Update widget with display strings
    const displayStrings = flatItems.map(item => item.display);
    widget.setItems(displayStrings);
  };

  const getSelectedKey = (): string | undefined => {
    const selected = (widget as any).selected;
    if (selected >= 0 && selected < flatItems.length) {
      return flatItems[selected].fullKey;
    }
    return undefined;
  };

  const toggleCurrentNode = (): void => {
    const selected = (widget as any).selected;
    if (selected >= 0 && selected < flatItems.length) {
      const item = flatItems[selected];
      
      // Only toggle if it's a parent node
      if (item.isParent) {
        toggleNode(item.nodeRef);
        
        // Rebuild the flat list
        if (treeRoot) {
          flatItems = flattenTree(treeRoot);
          const displayStrings = flatItems.map(item => item.display);
          widget.setItems(displayStrings);
          
          // Try to keep selection on the same item
          (widget as any).select(selected);
          widget.screen.render();
        }
      }
    }
  };

  // Handle Enter key to toggle expansion
  widget.key('enter', () => {
    toggleCurrentNode();
  });

  // Handle Space key to toggle expansion (alternative)
  widget.key('space', () => {
    toggleCurrentNode();
  });

  // Right arrow to expand
  widget.key('right', () => {
    const selected = (widget as any).selected;
    if (selected >= 0 && selected < flatItems.length) {
      const item = flatItems[selected];
      if (item.isParent && !item.isExpanded) {
        toggleCurrentNode();
      }
    }
  });

  // Left arrow to collapse
  widget.key('left', () => {
    const selected = (widget as any).selected;
    if (selected >= 0 && selected < flatItems.length) {
      const item = flatItems[selected];
      if (item.isParent && item.isExpanded) {
        toggleCurrentNode();
      }
    }
  });

  return { 
    widget, 
    updateItems,
    getSelectedKey,
    toggleCurrentNode
  };
}
