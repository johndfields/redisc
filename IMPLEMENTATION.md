# Redis Browser Refactoring Implementation Plan

## Overview
This document outlines the plan to refactor the monolithic `redis-browser.js` (817 lines) into a modular, maintainable structure.

## Current State
- Single file: `redis-browser.js` (817 lines)
- Mixed concerns: config, connection, Redis ops, UI, lifecycle
- Hard to test and maintain

## Target Structure

```
redis-spec/
├── redis-browser.js                 # Main entry point (~50 lines)
├── src/
│   ├── config/
│   │   ├── environment.js          # Environment file loading & validation
│   │   ├── redis-config.js         # Redis configuration parsing
│   │   └── ssh-config.js           # SSH tunnel configuration
│   │
│   ├── connection/
│   │   ├── redis-client.js         # Redis client connection wrapper
│   │   ├── ssh-tunnel.js           # SSH tunnel establishment
│   │   └── connection-tester.js    # Connection testing utility
│   │
│   ├── redis/
│   │   ├── key-manager.js          # Key loading, filtering, pattern matching
│   │   ├── value-fetcher.js        # Get values for different Redis types
│   │   └── key-operations.js       # Delete, TTL operations
│   │
│   ├── ui/
│   │   ├── screen-manager.js       # Main UI setup and layout
│   │   ├── components/
│   │   │   ├── key-list.js         # Left panel - key list component
│   │   │   ├── value-display.js    # Right panel - value display
│   │   │   ├── status-bar.js       # Bottom status bar
│   │   │   ├── search-box.js       # Search dialog component
│   │   │   └── help-box.js         # Help dialog component
│   │   ├── dialogs/
│   │   │   ├── pattern-dialog.js   # Pattern input dialog
│   │   │   ├── ttl-dialog.js       # TTL display dialog
│   │   │   └── delete-dialog.js    # Deletion confirmation dialog
│   │   └── keyboard-handler.js     # Global keyboard shortcuts
│   │
│   └── utils/
│       ├── formatters.js           # TTL formatting, value formatting
│       └── lifecycle.js            # Cleanup and shutdown handlers
```

## Implementation Phases

### ✅ Phase 0: Planning
- [x] Analyze original file
- [x] Design new structure
- [x] Create IMPLEMENTATION.md

### ✅ Phase 1: Configuration Layer
**Status:** ✅ COMPLETE

**Files created:**
1. ✅ `src/config/environment.ts` (Lines 15-41 from original)
   - Parse CLI arguments (`--env`, `--test-conn`)
   - Validate .env file existence
   - Load dotenv configuration
   - **Exports:** `loadEnvironment()` → `EnvironmentConfig`
   - **Interface:** `EnvironmentConfig { envFile, envPath, shouldTestConnection }`

2. ✅ `src/config/redis-config.ts` (Lines 54-59 from original)
   - Parse Redis environment variables
   - Provide sensible defaults
   - **Exports:** `getRedisConfig()` → `RedisConfig`
   - **Interface:** `RedisConfig { host, port, password?, database }`

3. ✅ `src/config/ssh-config.ts` (Lines 43-52 from original)
   - Parse SSH environment variables
   - Load private key from file
   - Handle authentication methods
   - **Exports:** `getSSHConfig()` → `SSHConfig | null`
   - **Interface:** `SSHConfig { host, port, username, privateKey?, passphrase?, password? }`

**Testing:**
- ✅ TypeScript compilation successful (no errors)
- ✅ All interfaces properly typed

### ✅ Phase 2: Connection Layer
**Status:** ✅ COMPLETE

**Files created:**
1. ✅ `src/connection/ssh-tunnel.ts` (Lines 78-136 from original)
   - Establish SSH tunnel using tunnel-ssh
   - Return local host/port
   - **Exports:** `createSSHTunnel(sshConfig, redisConfig, statusCallback?)` → `Promise<SSHTunnelResult>`
   - **Interface:** `SSHTunnelResult { host, port, cleanup }`
   - **Type:** `StatusCallback = (message: string) => void`

2. ✅ `src/connection/redis-client.ts` (Lines 73-162 from original)
   - Create Redis client
   - Handle SSH tunnel if needed
   - Connect to Redis
   - **Exports:** `connectRedis(redisConfig, sshConfig, statusCallback?)` → `Promise<RedisConnectionResult>`
   - **Interface:** `RedisConnectionResult { client, cleanup }`

3. ✅ `src/connection/connection-tester.ts` (Lines 635-783 from original)
   - Run connection diagnostics
   - Test SSH tunnel + Redis
   - Display configuration and results
   - **Exports:** `testConnection(envFile, redisConfig, sshConfig)` → `Promise<void>`

**Testing:**
- ✅ TypeScript compilation successful (no errors)
- ✅ All interfaces properly typed
- ✅ SSH tunnel types properly defined

### ✅ Phase 3: Redis Operations Layer
**Status:** ✅ COMPLETE

**Files created:**
1. ✅ `src/utils/formatters.ts` (Lines 226-237, 282-285 from original)
   - Format TTL as human-readable
   - Format TTL details
   - **Exports:** `formatTTL(ttl)` → `TTLInfo`, `formatTTLDetails(ttl)` → `string`
   - **Interface:** `TTLInfo { rawTTL, display, hasExpiration, exists }`

2. ✅ `src/redis/value-fetcher.ts` (Lines 222-271 from original)
   - Fetch values for all Redis types
   - Use formatters for display
   - **Exports:** `getKeyInfo(client, key)` → `Promise<string>`
   - Supports: string, list, set, zset, hash

3. ✅ `src/redis/key-operations.ts` (Lines 273-307 from original)
   - Get TTL for a key
   - Delete a key
   - **Exports:** `getTTL(client, key)` → `Promise<TTLInfo>`, `getTTLMessage(client, key)` → `Promise<string>`, `deleteKey(client, key)` → `Promise<number>`

4. ✅ `src/redis/key-manager.ts` (Lines 164-213 from original)
   - Load keys using SCAN
   - Filter keys by search term
   - Apply Redis patterns
   - **Exports:** `KeyManager` class
   - **Methods:** `loadKeys(pattern)`, `filterKeys(searchTerm)`, `clearFilter()`, `getAllKeys()`, `getFilteredKeys()`, `getCurrentPattern()`, `getCurrentSearchTerm()`, `getCounts()`

**Testing:**
- ✅ TypeScript compilation successful (no errors)
- ✅ All interfaces properly typed
- ✅ KeyManager class with full functionality

### ✅ Phase 4: UI Components Layer
**Status:** ✅ COMPLETE

**Files created:**
1. ✅ `src/ui/screen-manager.ts` (Lines 429-436, 632-633 from original)
   - Initialize blessed screen
   - **Exports:** `createScreen(envFile)` → screen instance

2. ✅ `src/ui/components/status-bar.ts` (Lines 541-552, 214-220 from original)
   - Create status bar widget
   - Format and update status messages
   - **Exports:** `createStatusBar(screen)` → `StatusBarWidget`
   - **Interface:** `StatusBarWidget { widget, update(envFile, allCount, filteredCount) }`

3. ✅ `src/ui/components/value-display.ts` (Lines 468-495 from original)
   - Create value display box
   - **Exports:** `createValueDisplay(screen)` → `ValueDisplayWidget`
   - **Interface:** `ValueDisplayWidget { widget, setValue(label, content), setLoading() }`

4. ✅ `src/ui/components/key-list.ts` (Lines 437-466 from original)
   - Create key list widget
   - **Exports:** `createKeyList(screen)` → `KeyListWidget`
   - **Interface:** `KeyListWidget { widget, updateItems(keys) }`

5. ✅ `src/ui/components/search-box.ts` (Lines 497-515, 569-586 from original)
   - Create search input textbox
   - Handle submit/cancel events
   - **Exports:** `createSearchBox(screen, onSearch, onCancel)` → `SearchBoxWidget`
   - **Interface:** `SearchBoxWidget { widget, show() }`

6. ✅ `src/ui/components/help-box.ts` (Lines 517-538, 588-593, 391-427 from original)
   - Create help dialog
   - Format help text
   - **Exports:** `createHelpBox(screen, onClose)` → `HelpBoxWidget`
   - **Interface:** `HelpBoxWidget { widget, show() }`

**Testing:**
- ✅ TypeScript compilation successful (no errors)
- ✅ All interfaces properly typed

### ✅ Phase 5: UI Dialogs Layer
**Status:** ✅ COMPLETE

**Files created:**
1. ✅ `src/ui/dialogs/ttl-dialog.ts` (Lines 273-307 from original)
   - Show TTL information dialog
   - **Exports:** `showTTLDialog(screen, client, key, onClose)` → `Promise<void>`

2. ✅ `src/ui/dialogs/delete-dialog.ts` (Lines 309-354 from original)
   - Show deletion confirmation dialog
   - **Exports:** `showDeleteDialog(screen, key, onConfirm, onCancel)` → `void`

3. ✅ `src/ui/dialogs/pattern-dialog.ts` (Lines 363-389 from original)
   - Show pattern input dialog
   - **Exports:** `showPatternDialog(screen, currentPattern, onSubmit, onCancel)` → `void`

**Testing:**
- ✅ TypeScript compilation successful (no errors)
- ✅ All interfaces properly typed

### ✅ Phase 6: UI Event Handlers
**Status:** ✅ COMPLETE

**Files created:**
1. ✅ `src/ui/keyboard-handler.ts` (Lines 596-614 from original)
   - Setup global keyboard shortcuts
   - **Exports:** `setupKeyboardHandlers(screen, handlers)` → `void`
   - **Interface:** `KeyboardHandlers { onSearch, onPattern, onHelp, onRefresh, onQuit }`

2. ✅ `src/utils/lifecycle.ts` (Lines 785-796 from original)
   - Cleanup Redis and SSH connections
   - **Exports:** `setupCleanup(cleanupFunctions)` → cleanup function
   - **Type:** `CleanupFunction = () => Promise<void>`

**Testing:**
- ✅ TypeScript compilation successful (no errors)
- ✅ All interfaces properly typed

### ✅ Phase 7: Main Application Integration
**Status:** ✅ COMPLETE

**Files created:**
1. ✅ `redis-browser.ts` (New modular entry point, ~205 lines)
   - Import all modules
   - Wire components together
   - Handle --test-conn flag
   - Start application
   - All event handlers properly connected

**Testing:**
- ✅ TypeScript compilation successful (no errors)
- ⬜ Full end-to-end testing pending
- ⬜ Test all features work as before
- ⬜ Test with different .env configurations
- ⬜ Test SSH tunnel connections
- ⬜ Test connection testing mode

### ⬜ Phase 8: Final Cleanup
**Status:** In Progress

**Tasks:**
- ✅ All TypeScript files compiled successfully
- ✅ All modules properly integrated
- ⬜ Test the application with real Redis connection
- ⬜ Archive original redis-browser.js
- ⬜ Update package.json scripts if needed
- ⬜ Final testing pass
- ⬜ Update this document with final status

## Key Principles

1. **Incremental Migration**: Complete one phase at a time, test before moving on
2. **Backward Compatibility**: Keep original file until all phases complete
3. **Clear Interfaces**: Each module has well-defined exports
4. **Single Responsibility**: Each file has one clear purpose
5. **Minimal Dependencies**: Modules depend on lower layers only
6. **Error Handling**: Preserve all error handling from original
7. **Feature Parity**: All original functionality must work

## Dependency Graph

```
Main Entry (redis-browser.js)
    ├── config/environment.js (no dependencies)
    ├── config/redis-config.js (no dependencies)
    ├── config/ssh-config.js (fs)
    │
    ├── connection/ssh-tunnel.js (tunnel-ssh, config)
    ├── connection/redis-client.js (redis, ssh-tunnel, config)
    ├── connection/connection-tester.js (redis-client, ssh-tunnel, config)
    │
    ├── utils/formatters.js (no dependencies)
    ├── utils/lifecycle.js (no dependencies)
    │
    ├── redis/value-fetcher.js (formatters)
    ├── redis/key-operations.js (formatters)
    ├── redis/key-manager.js (no dependencies)
    │
    ├── ui/screen-manager.js (blessed)
    ├── ui/components/* (blessed)
    ├── ui/dialogs/* (blessed, formatters)
    └── ui/keyboard-handler.js (blessed)
```

## Notes

- All modules use TypeScript with proper type definitions
- Use ES6 imports/exports
- Preserve all original functionality
- Keep error messages and user feedback identical
- Maintain blessed.js styling and layouts
- Test incrementally after each phase
- Update this document as phases complete
