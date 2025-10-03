# Redisc Browser - Quick Start Guide

## Overview
Redisc - a tool for Redis discovery
A terminal-based Redis key browser with support for SSH tunneling, pattern matching, and full CRUD operations.

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here    # Optional
REDIS_DB=0

# SSH Tunnel Configuration (optional)
USE_SSH=false
SSH_HOST=your.server.com
SSH_PORT=22
SSH_USERNAME=your_username
SSH_PRIVATE_KEY_PATH=/path/to/private/key
SSH_PASSPHRASE=key_passphrase        # Optional
SSH_PASSWORD=ssh_password            # Alternative to key
```

### Multiple Environments

Create multiple environment files:
- `.env` - Default/development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## Running the Application

### Start with default environment (.env)
```bash
npm start
```

### Start with specific environment
```bash
npm start -- --env staging      # Uses .env.staging
npm start -- --env production   # Uses .env.production
```

### Test connection without starting UI
```bash
npm run test-conn               # Test default connection
npm run test-conn -- --env production  # Test production connection
```

### Type checking
```bash
npm run typecheck
```

## Keyboard Shortcuts

### Navigation
- `↑/↓` or `j/k` - Navigate key list
- `Enter` - View selected key value
- Mouse - Click and scroll anywhere

### Search & Filter
- `/` - Search keys (filter current list)
- `p` - Pattern match (reload with Redis pattern)
- `Esc` - Clear search/close dialogs

### Actions
- `d` - Delete selected key (with confirmation)
- `t` - Show TTL for selected key
- `r` - Refresh key list
- `Ctrl-t` or `^t` - Toggle tree view mode

### Tree View Mode
- `Enter/Space` - Expand/collapse folder
- `→` - Expand selected folder
- `←` - Collapse selected folder
- `d` - Delete single key OR bulk delete all keys in folder

### Other
- `?` - Show help
- `q` or `Ctrl-C` - Quit application

## Redis Patterns

When using the pattern dialog (`p` key):

- `*` - Match any characters
- `?` - Match single character
- `user:*` - Match keys starting with 'user:'
- `*:session` - Match keys ending with ':session'
- `user:?:*` - Match 'user:' + 1 char + anything

Examples:
- `session:*` - All session keys
- `cache:user:*` - All user cache entries
- `temp:*:data` - All temporary data keys

## Features

### Tree View Mode
- **Hierarchical Display**: Organize keys by their prefixes (`:`, `/`, `.`, `-`)
- **Auto-detect Delimiter**: Automatically detects the delimiter used in your keys
- **Expandable Folders**: Navigate through nested key structures like a file system
- **Bulk Operations**: Delete entire folders (all keys matching a prefix) with one action
- **Toggle Anytime**: Press `Ctrl-t` to switch between flat list and tree view

### Bulk Delete
- **Folder Deletion**: In tree view, delete all keys under a folder prefix
- **Safety Confirmations**: Shows exact pattern and key count before deletion
- **Warning for Large Deletes**: Red warning displayed when deleting >1000 keys
- **Batched Processing**: Deletes processed in batches of 500 for reliability
- **Progress Display**: Real-time progress shown during bulk operations
- **Boundary Checking**: Prevents partial matches (e.g., `user:123` won't match `user:1234`)

### Supported Redis Types
- **String** - Simple string values
- **List** - Ordered collections (shows index and value)
- **Set** - Unordered unique collections
- **Sorted Set (ZSet)** - Ordered sets with scores
- **Hash** - Field-value pairs

### TTL Display
All key views show TTL information:
- Human-readable format (Xh Ym Zs)
- Raw seconds value
- "No expiration" for persistent keys

### Safe Deletion
Delete operations require typing 'yes' to confirm, preventing accidental data loss.

## SSH Tunnel Support

To connect to Redis through an SSH tunnel:

1. Set `USE_SSH=true` in your `.env` file
2. Configure SSH credentials (key or password)
3. Set `REDIS_HOST` to the Redis host as seen from the SSH server
4. The tunnel will be established automatically on startup

Example for remote Redis:
```env
USE_SSH=true
SSH_HOST=bastion.example.com
SSH_PORT=22
SSH_USERNAME=admin
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa
REDIS_HOST=redis.internal.example.com  # Internal address
REDIS_PORT=6379
```

## Troubleshooting

### Connection Issues

Run the connection test to diagnose issues:
```bash
npm run test-conn
```

This will show:
- ✅ SSH tunnel status (if enabled)
- ✅ Redis connection status
- ✅ Redis version and database info
- ❌ Detailed error messages with troubleshooting tips

### Common Issues

**Can't connect to Redis**
- Verify Redis is running: `redis-cli ping`
- Check host/port in .env file
- Verify firewall allows connection
- Check Redis password if required

**SSH tunnel fails**
- Verify SSH credentials
- Check SSH host/port
- Ensure private key file exists and has correct permissions (600)
- Test SSH connection manually: `ssh user@host`

**Keys not loading**
- Check Redis database number (REDIS_DB)
- Verify pattern matches your keys
- Ensure you have permission to scan keys

## Development

### Project Structure
```
src/
├── config/          # Configuration loading
├── connection/      # Redis & SSH connection management
├── redis/           # Redis operations (keys, values, TTL)
├── ui/             # Terminal UI components and dialogs
└── utils/          # Utility functions
```

### Type Checking
```bash
npm run typecheck
```

All code is written in TypeScript with full type safety.

### Running Old Version
The original JavaScript version is preserved:
```bash
npm run start:old
```

## Usage Examples

### Tree View Workflow

1. **Enable tree view**:
   - Press `Ctrl-t` to switch to tree view
   - Keys are automatically organized by delimiter (`:`, `/`, `.`, `-`)

2. **Navigate folders**:
   - Use arrow keys to move between items
   - Press `Enter` or `Space` to expand/collapse folders
   - Press `→` to expand, `←` to collapse

3. **View key values**:
   - Navigate to a key (leaf node, no expand icon)
   - Press `Enter` to view the key's value

4. **Bulk delete a folder**:
   - Navigate to a folder node (has `▶` or `▼` icon)
   - Press `d` to delete ALL keys under that folder
   - Confirm the deletion (shows pattern like `user:session:*` and key count)
   - Watch progress as keys are deleted in batches

### Example Key Structures

**E-commerce keys**:
```
user:123:profile
user:123:cart
user:123:orders
user:456:profile
```
In tree view:
```
▼ user
  ▶ 123 (3 keys)
  ▶ 456 (1 key)
```

**Cache keys**:
```
cache/api/v1/users
cache/api/v1/products
cache/api/v2/users
```
In tree view:
```
▼ cache
  ▼ api
    ▶ v1 (2 keys)
    ▶ v2 (1 key)
```

## Tips & Best Practices

1. **Large Databases**: Use specific patterns instead of `*` to avoid loading too many keys
2. **Pattern Testing**: Use `p` to test different patterns without restarting
3. **Search vs Pattern**: 
   - Search (`/`) filters already loaded keys (fast, client-side)
   - Pattern (`p`) reloads from Redis with new pattern (slower, server-side)
4. **Tree View**: Best for exploring unfamiliar databases or managing hierarchical key structures
5. **Bulk Delete**: Always review the pattern and key count carefully before confirming
6. **SSH Tunnels**: Keep tunnel configuration in separate .env files for different environments
7. **Safety**: Always double-check before deleting keys in production

## Support

For issues or questions:
1. Check the connection test output: `npm run test-conn`
2. Review the error messages in the status bar
3. Check the REFACTORING_SUMMARY.md for architecture details
4. Review IMPLEMENTATION.md for technical implementation details

## Version Information

- **TypeScript**: Full type safety with zero compilation errors
- **Modules**: 22 modular files for maintainability
- **Lines of Code**: ~2,300 lines (from 816 monolithic lines)
- **Dependencies**:
  - `redis` - Redis client
  - `blessed` - Terminal UI framework
  - `tunnel-ssh` - SSH tunnel support
  - `dotenv` - Environment configuration
