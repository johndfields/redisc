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

## Tips & Best Practices

1. **Large Databases**: Use specific patterns instead of `*` to avoid loading too many keys
2. **Pattern Testing**: Use `p` to test different patterns without restarting
3. **Search vs Pattern**: 
   - Search (`/`) filters already loaded keys (fast, client-side)
   - Pattern (`p`) reloads from Redis with new pattern (slower, server-side)
4. **SSH Tunnels**: Keep tunnel configuration in separate .env files for different environments
5. **Safety**: Always double-check before deleting keys in production

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
