/**
 * Tree structure utilities for organizing Redis keys hierarchically
 */

export interface TreeNode {
  name: string;
  fullKey?: string; // Only exists for leaf nodes (actual keys)
  fullPath?: string; // Full path prefix for folder nodes
  delimiter?: string; // Delimiter used to build this tree (stored at root)
  children: Map<string, TreeNode>;
  isExpanded: boolean;
  level: number;
}

export interface FlatTreeItem {
  display: string;
  fullKey?: string; // undefined for parent nodes, defined for leaf keys
  fullPath?: string; // Full path prefix for folder nodes
  isParent: boolean;
  isExpanded: boolean;
  level: number;
  nodeRef: TreeNode; // Reference to the actual tree node for toggling
}

/**
 * Determine the delimiter used in keys
 * Common patterns: 'user:123:profile', 'cache/user/123', 'app.config.redis'
 */
export function detectDelimiter(keys: string[]): string {
  const delimiters = [':', '/', '.', '-'];
  const counts = delimiters.map(delim => ({
    delim,
    count: keys.reduce((acc, key) => acc + (key.split(delim).length - 1), 0)
  }));
  
  // Return delimiter with highest count, default to ':'
  counts.sort((a, b) => b.count - a.count);
  return counts[0].count > 0 ? counts[0].delim : ':';
}

/**
 * Build a tree structure from Redis keys
 */
export function buildTree(keys: string[], delimiter?: string): TreeNode {
  if (!delimiter) {
    delimiter = detectDelimiter(keys);
  }

  const root: TreeNode = {
    name: 'root',
    delimiter: delimiter, // Store delimiter at root for later use
    children: new Map(),
    isExpanded: true,
    level: -1
  };

  for (const key of keys) {
    const parts = key.split(delimiter);
    let currentNode = root;
    let pathParts: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      pathParts.push(part);

      if (!currentNode.children.has(part)) {
        const newNode: TreeNode = {
          name: part,
          fullKey: isLeaf ? key : undefined,
          fullPath: !isLeaf ? pathParts.join(delimiter) : undefined,
          children: new Map(),
          isExpanded: false,
          level: i
        };
        currentNode.children.set(part, newNode);
      }

      currentNode = currentNode.children.get(part)!;
      
      // Update fullPath for folders as we discover they have children
      if (!isLeaf && !currentNode.fullPath) {
        currentNode.fullPath = pathParts.join(delimiter);
      }
      
      // If this is a leaf node, store the full key
      if (isLeaf) {
        currentNode.fullKey = key;
      }
    }
  }

  return root;
}

/**
 * Flatten tree to a displayable list
 */
export function flattenTree(root: TreeNode): FlatTreeItem[] {
  const result: FlatTreeItem[] = [];

  function traverse(node: TreeNode) {
    // Don't include the root node in the display
    if (node.level >= 0) {
      const hasChildren = node.children.size > 0;
      const indent = '  '.repeat(node.level);
      const expandIcon = hasChildren ? (node.isExpanded ? '▼ ' : '▶ ') : '  ';
      
      result.push({
        display: `${indent}${expandIcon}${node.name}`,
        fullKey: node.fullKey,
        fullPath: node.fullPath,
        isParent: hasChildren,
        isExpanded: node.isExpanded,
        level: node.level,
        nodeRef: node
      });
    }

    // Only traverse children if node is expanded
    if (node.isExpanded || node.level < 0) {
      // Sort children: parents first, then by name
      const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
        const aIsParent = a.children.size > 0;
        const bIsParent = b.children.size > 0;
        
        if (aIsParent !== bIsParent) {
          return bIsParent ? 1 : -1; // Parents come first
        }
        return a.name.localeCompare(b.name);
      });

      for (const child of sortedChildren) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return result;
}

/**
 * Toggle expansion state of a tree node
 */
export function toggleNode(node: TreeNode): void {
  node.isExpanded = !node.isExpanded;
}

/**
 * Expand all nodes in the tree
 */
export function expandAll(node: TreeNode): void {
  node.isExpanded = true;
  for (const child of node.children.values()) {
    expandAll(child);
  }
}

/**
 * Collapse all nodes in the tree
 */
export function collapseAll(node: TreeNode): void {
  node.isExpanded = false;
  for (const child of node.children.values()) {
    collapseAll(child);
  }
}

/**
 * Count total nodes in tree
 */
export function countNodes(node: TreeNode): number {
  let count = node.level >= 0 ? 1 : 0;
  for (const child of node.children.values()) {
    count += countNodes(child);
  }
  return count;
}

/**
 * Count leaf nodes (actual keys) in tree
 */
export function countLeafNodes(node: TreeNode): number {
  if (node.fullKey) {
    return 1;
  }
  let count = 0;
  for (const child of node.children.values()) {
    count += countLeafNodes(child);
  }
  return count;
}

/**
 * Get all leaf keys (actual Redis keys) under a node
 */
export function getAllKeysUnderNode(node: TreeNode): string[] {
  const keys: string[] = [];
  
  function traverse(n: TreeNode) {
    if (n.fullKey) {
      keys.push(n.fullKey);
    }
    for (const child of n.children.values()) {
      traverse(child);
    }
  }
  
  traverse(node);
  return keys;
}

/**
 * Get the delimiter used in the tree
 * Walks up to root to find the stored delimiter
 */
export function getTreeDelimiter(root: TreeNode): string {
  return root.delimiter || ':';
}
