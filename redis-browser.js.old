// Redis CLI Browser
// Install dependencies: npm install redis blessed dotenv tunnel-ssh

import { createClient } from 'redis';
import blessed from 'blessed';
import dotenv from 'dotenv';
import { createTunnel } from 'tunnel-ssh';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const envIndex = args.indexOf('--env');
const shouldTestConnection = args.includes('--test-conn');
let envFile = '.env';

if (envIndex !== -1 && args[envIndex + 1]) {
  const envName = args[envIndex + 1];
  envFile = `.env.${envName}`;
}

const envPath = join(__dirname, envFile);

if (!existsSync(envPath)) {
  console.error(`Error: Environment file '${envFile}' not found at ${envPath}`);
  console.error('\nAvailable options:');
  console.error('  node redis-browser.js              (uses .env)');
  console.error('  node redis-browser.js --env staging   (uses .env.staging)');
  console.error('  node redis-browser.js --env production (uses .env.production)');
  process.exit(1);
}

// Load environment variables from specified .env file
dotenv.config({ path: envPath });

console.log(`Loading configuration from: ${envFile}`);

// Configuration
const USE_SSH = process.env.USE_SSH === 'true';

const SSH_CONFIG = USE_SSH ? {
  host: process.env.SSH_HOST,
  port: parseInt(process.env.SSH_PORT || '22'),
  username: process.env.SSH_USERNAME,
  privateKey: process.env.SSH_PRIVATE_KEY_PATH ? readFileSync(process.env.SSH_PRIVATE_KEY_PATH) : undefined,
  passphrase: process.env.SSH_PASSPHRASE || undefined,
  password: process.env.SSH_PASSWORD || undefined
} : null;

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0')
};

let redisClient;
let screen;
let keyList;
let valueBox;
let statusBar;
let searchBox;
let helpBox;
let allKeys = [];
let filteredKeys = [];
let currentPattern = '*';
let sshTunnel = null;

async function connectRedis() {
  let redisHost = REDIS_CONFIG.host;
  let redisPort = REDIS_CONFIG.port;

  // Set up SSH tunnel if configured
  if (USE_SSH && SSH_CONFIG) {
    try {
      statusBar.setContent(' Establishing SSH tunnel...');
      screen.render();

      const tunnelOptions = {
        autoClose: true
      };

      const serverOptions = {
        port: 0 // Let the system assign a free port
      };

      const sshOptions = {
        host: SSH_CONFIG.host,
        port: SSH_CONFIG.port,
        username: SSH_CONFIG.username
      };

      // Add authentication method
      if (SSH_CONFIG.privateKey) {
        sshOptions.privateKey = SSH_CONFIG.privateKey;
        if (SSH_CONFIG.passphrase) {
          sshOptions.passphrase = SSH_CONFIG.passphrase;
        }
      } else if (SSH_CONFIG.password) {
        sshOptions.password = SSH_CONFIG.password;
      }

      const forwardOptions = {
        srcAddr: '127.0.0.1',
        srcPort: 0,
        dstAddr: REDIS_CONFIG.host,
        dstPort: REDIS_CONFIG.port
      };

      const [server, conn] = await createTunnel(
        tunnelOptions,
        serverOptions,
        sshOptions,
        forwardOptions
      );

      sshTunnel = { server, conn };

      // Get the local port that was assigned
      const address = server.address();
      redisHost = '127.0.0.1';
      redisPort = address.port;

      statusBar.setContent(' SSH tunnel established, connecting to Redis...');
      screen.render();
    } catch (err) {
      console.error('SSH Tunnel Error:', err);
      statusBar.setContent(` SSH tunnel failed: ${err.message}`);
      screen.render();
      process.exit(1);
    }
  }

  // Connect to Redis (either directly or through SSH tunnel)
  const config = {
    socket: {
      host: redisHost,
      port: redisPort
    }
  };

  if (REDIS_CONFIG.password) {
    config.password = REDIS_CONFIG.password;
  }

  if (REDIS_CONFIG.database) {
    config.database = REDIS_CONFIG.database;
  }

  redisClient = createClient(config);

  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
    process.exit(1);
  });

  await redisClient.connect();
}

async function loadKeys(pattern = '*') {
  try {
    statusBar.setContent(' Loading keys...');
    screen.render();

    const keys = [];
    let cursor = 0;

    do {
      const result = await redisClient.scan(cursor.toString(), {
        MATCH: pattern,
        COUNT: 100
      });
      cursor = parseInt(result.cursor);
      keys.push(...result.keys);
    } while (cursor !== 0);

    allKeys = keys.sort();
    filteredKeys = allKeys;
    updateKeyList();
    
    updateStatusBar();
    screen.render();
  } catch (err) {
    statusBar.setContent(` Error loading keys: ${err.message}`);
    screen.render();
  }
}

function updateKeyList() {
  const items = filteredKeys.map(key => {
    return key;
  });
  keyList.setItems(items);
  screen.render();
}

function filterKeys(searchTerm) {
  if (!searchTerm || searchTerm === '') {
    filteredKeys = allKeys;
  } else {
    const lowerSearch = searchTerm.toLowerCase();
    filteredKeys = allKeys.filter(key => 
      key.toLowerCase().includes(lowerSearch)
    );
  }
  updateKeyList();
  updateStatusBar();
}

function updateStatusBar() {
  const envName = envFile === '.env' ? 'default' : envFile.replace('.env.', '');
  const showing = filteredKeys.length !== allKeys.length 
    ? `Showing: ${filteredKeys.length}/${allKeys.length}` 
    : `Keys: ${allKeys.length}`;
  statusBar.setContent(` [${envName.toUpperCase()}] | ${showing} | /: Search | p: Pattern | d: Delete | t: TTL | r: Refresh | ?: Help | q: Quit`);
}

async function getKeyInfo(key) {
  try {
    const type = await redisClient.type(key);
    const ttl = await redisClient.ttl(key);
    let ttlDisplay = '';
    
    if (ttl === -1) {
      ttlDisplay = 'No expiration';
    } else if (ttl === -2) {
      ttlDisplay = 'Key does not exist';
    } else {
      const hours = Math.floor(ttl / 3600);
      const minutes = Math.floor((ttl % 3600) / 60);
      const seconds = ttl % 60;
      ttlDisplay = `${hours}h ${minutes}m ${seconds}s`;
    }

    let value;
    let display;

    switch (type) {
      case 'string':
        value = await redisClient.get(key);
        display = `Type: STRING | TTL: ${ttlDisplay}\n\n${value}`;
        break;
      case 'list':
        value = await redisClient.lRange(key, 0, -1);
        display = `Type: LIST (${value.length} items) | TTL: ${ttlDisplay}\n\n${value.map((v, i) => `[${i}] ${v}`).join('\n')}`;
        break;
      case 'set':
        value = await redisClient.sMembers(key);
        display = `Type: SET (${value.length} members) | TTL: ${ttlDisplay}\n\n${value.join('\n')}`;
        break;
      case 'zset':
        value = await redisClient.zRangeWithScores(key, 0, -1);
        display = `Type: SORTED SET (${value.length} members) | TTL: ${ttlDisplay}\n\n${value.map(v => `${v.score}: ${v.value}`).join('\n')}`;
        break;
      case 'hash':
        value = await redisClient.hGetAll(key);
        display = `Type: HASH (${Object.keys(value).length} fields) | TTL: ${ttlDisplay}\n\n${Object.entries(value).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
        break;
      default:
        display = `Type: ${type.toUpperCase()} | TTL: ${ttlDisplay}\n\nUnsupported type`;
    }

    return display;
  } catch (err) {
    return `Error fetching value: ${err.message}`;
  }
}

async function showTTLDialog(key) {
  const ttl = await redisClient.ttl(key);
  let message = '';
  
  if (ttl === -1) {
    message = `Key: ${key}\n\nNo expiration set`;
  } else if (ttl === -2) {
    message = `Key: ${key}\n\nKey does not exist`;
  } else {
    const hours = Math.floor(ttl / 3600);
    const minutes = Math.floor((ttl % 3600) / 60);
    const seconds = ttl % 60;
    message = `Key: ${key}\n\nTTL: ${ttl} seconds\n(${hours}h ${minutes}m ${seconds}s)`;
  }

  const box = blessed.message({
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
    }
  });

  box.display(message, 0, () => {
    keyList.focus();
  });
}

async function deleteKey(key) {
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
      try {
        await redisClient.del(key);
        await loadKeys(currentPattern);
        valueBox.setContent(`{green-fg}✓ Key deleted successfully:{/green-fg} ${key}`);
        statusBar.setContent(` Key deleted: ${key}`);
        keyList.focus();
      } catch (err) {
        valueBox.setContent(`{red-fg}✗ Error deleting key:{/red-fg} ${err.message}`);
      }
    } else {
      valueBox.setContent('Delete cancelled');
      keyList.focus();
    }
    screen.render();
  });
}

function showSearchBox() {
  searchBox.show();
  searchBox.focus();
  searchBox.setValue('');
  screen.render();
}

function showPatternBox() {
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
      currentPattern = value;
      await loadKeys(currentPattern);
    }
    keyList.focus();
    screen.render();
  });
}

function showHelp() {
  const helpText = `
  REDIS CLI BROWSER - HELP
  
  Navigation:
    ↑/↓ or j/k      Navigate key list
    Enter           View selected key value
    Mouse           Click and scroll
  
  Search & Filter:
    /               Search keys (filter current list)
    p               Pattern match (reload with Redis pattern)
    Esc             Clear search/close dialogs
  
  Actions:
    d               Delete selected key (with confirmation)
    t               Show TTL for selected key
    r               Refresh key list
  
  Redis Patterns (for 'p' command):
    *               Match any characters
    ?               Match single character
    user:*          Match keys starting with 'user:'
    *:session       Match keys ending with ':session'
    user:?:*        Match 'user:' + 1 char + anything
  
  Other:
    ?               Show this help
    q or Ctrl-C     Quit application
  
  Press any key to close...`;

  helpBox.setContent(helpText);
  helpBox.show();
  helpBox.focus();
  screen.render();
}

function setupUI() {
  const envName = envFile === '.env' ? 'Redis Browser' : `Redis Browser - ${envFile.replace('.env.', '').toUpperCase()}`;
  
  screen = blessed.screen({
    smartCSR: true,
    title: envName
  });

  // Key list on the left
  keyList = blessed.list({
    parent: screen,
    label: ' Redis Keys ',
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

  // Value display on the right
  valueBox = blessed.box({
    parent: screen,
    label: ' Value ',
    top: 0,
    left: '40%',
    width: '60%',
    height: '100%-1',
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    },
    scrollable: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollbar: {
      ch: '█',
      style: {
        fg: 'cyan'
      }
    },
    content: 'Select a key to view its value'
  });

  // Search box (hidden by default)
  searchBox = blessed.textbox({
    parent: screen,
    label: ' Search Keys (Esc to cancel) ',
    top: 'center',
    left: 'center',
    width: '50%',
    height: 3,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'yellow'
      }
    },
    hidden: true,
    inputOnFocus: true
  });

  // Help box (hidden by default)
  helpBox = blessed.box({
    parent: screen,
    label: ' Help ',
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'green'
      }
    },
    hidden: true,
    scrollable: true,
    keys: true,
    vi: true,
    mouse: true
  });

  // Status bar at the bottom
  statusBar = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    style: {
      fg: 'white',
      bg: 'blue'
    },
    content: ' Connecting to Redis...'
  });

  // Key selection handler
  keyList.on('select', async (item) => {
    const key = item.getText();
    if (!key) return;

    valueBox.setContent('Loading...');
    screen.render();

    const value = await getKeyInfo(key);
    valueBox.setLabel(` Value: ${key} `);
    valueBox.setContent(value);
    screen.render();
  });

  // Search box handlers
  searchBox.on('submit', (value) => {
    filterKeys(value);
    searchBox.hide();
    keyList.focus();
    screen.render();
  });

  searchBox.on('cancel', () => {
    searchBox.hide();
    keyList.focus();
    screen.render();
  });

  searchBox.key('escape', () => {
    searchBox.hide();
    keyList.focus();
    screen.render();
  });

  // Help box handlers
  helpBox.key(['escape', 'q', 'enter', 'space'], () => {
    helpBox.hide();
    keyList.focus();
    screen.render();
  });

  // Global key handlers
  screen.key(['q', 'C-c'], () => {
    cleanup();
  });

  screen.key('/', () => {
    showSearchBox();
  });

  screen.key('p', () => {
    showPatternBox();
  });

  screen.key('?', () => {
    showHelp();
  });

  screen.key('r', async () => {
    await loadKeys(currentPattern);
  });

  // Key list specific handlers
  keyList.key('d', async () => {
    const selected = keyList.selected;
    if (selected >= 0 && selected < filteredKeys.length) {
      await deleteKey(filteredKeys[selected]);
    }
  });

  keyList.key('t', async () => {
    const selected = keyList.selected;
    if (selected >= 0 && selected < filteredKeys.length) {
      await showTTLDialog(filteredKeys[selected]);
    }
  });

  keyList.focus();
  screen.render();
}

async function testConnection() {
  console.log('\n🔍 Testing connection...\n');
  console.log('Configuration:');
  console.log(`  Environment: ${envFile}`);
  console.log(`  Use SSH: ${USE_SSH}`);
  
  if (USE_SSH) {
    console.log(`  SSH Host: ${SSH_CONFIG.host}:${SSH_CONFIG.port}`);
    console.log(`  SSH User: ${SSH_CONFIG.username}`);
    console.log(`  SSH Auth: ${SSH_CONFIG.privateKey ? 'Private Key' : 'Password'}`);
    console.log(`  Redis Target: ${REDIS_CONFIG.host}:${REDIS_CONFIG.port}`);
  } else {
    console.log(`  Redis Host: ${REDIS_CONFIG.host}:${REDIS_CONFIG.port}`);
  }
  
  console.log(`  Redis DB: ${REDIS_CONFIG.database}`);
  console.log('');

  try {
    // Test SSH tunnel if enabled
    if (USE_SSH) {
      console.log('📡 Establishing SSH tunnel...');
      
      const tunnelOptions = { autoClose: true };
      const serverOptions = { port: 0 };
      const sshOptions = {
        host: SSH_CONFIG.host,
        port: SSH_CONFIG.port,
        username: SSH_CONFIG.username
      };

      if (SSH_CONFIG.privateKey) {
        sshOptions.privateKey = SSH_CONFIG.privateKey;
        if (SSH_CONFIG.passphrase) {
          sshOptions.passphrase = SSH_CONFIG.passphrase;
        }
      } else if (SSH_CONFIG.password) {
        sshOptions.password = SSH_CONFIG.password;
      }

      const forwardOptions = {
        srcAddr: '127.0.0.1',
        srcPort: 0,
        dstAddr: REDIS_CONFIG.host,
        dstPort: REDIS_CONFIG.port
      };

      const [server, conn] = await createTunnel(
        tunnelOptions,
        serverOptions,
        sshOptions,
        forwardOptions
      );

      const address = server.address();
      console.log(`✅ SSH tunnel established on local port ${address.port}`);

      // Connect to Redis through tunnel
      console.log('🔌 Connecting to Redis through tunnel...');
      const config = {
        socket: {
          host: '127.0.0.1',
          port: address.port
        }
      };

      if (REDIS_CONFIG.password) {
        config.password = REDIS_CONFIG.password;
      }
      if (REDIS_CONFIG.database) {
        config.database = REDIS_CONFIG.database;
      }

      const client = createClient(config);
      await client.connect();
      
      // Test Redis connection
      const pong = await client.ping();
      console.log(`✅ Redis connection successful: ${pong}`);
      
      // Get Redis info
      const info = await client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
      const keys = await client.dbSize();
      
      console.log(`📊 Redis version: ${version}`);
      console.log(`📊 Total keys in DB ${REDIS_CONFIG.database}: ${keys}`);
      
      await client.quit();
      server.close();
      conn.end();
      
    } else {
      // Direct connection
      console.log('🔌 Connecting to Redis...');
      const config = {
        socket: {
          host: REDIS_CONFIG.host,
          port: REDIS_CONFIG.port
        }
      };

      if (REDIS_CONFIG.password) {
        config.password = REDIS_CONFIG.password;
      }
      if (REDIS_CONFIG.database) {
        config.database = REDIS_CONFIG.database;
      }

      const client = createClient(config);
      await client.connect();
      
      const pong = await client.ping();
      console.log(`✅ Redis connection successful: ${pong}`);
      
      const info = await client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
      const keys = await client.dbSize();
      
      console.log(`📊 Redis version: ${version}`);
      console.log(`📊 Total keys in DB ${REDIS_CONFIG.database}: ${keys}`);
      
      await client.quit();
    }
    
    console.log('\n✅ Connection test passed!\n');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Connection test failed!');
    console.error(`Error: ${err.message}\n`);
    
    if (USE_SSH) {
      console.error('Troubleshooting tips:');
      console.error('  • Verify SSH host and port are correct');
      console.error('  • Check SSH credentials (username/key/password)');
      console.error('  • Ensure private key file exists and has correct permissions');
      console.error('  • Verify Redis host/port on remote server');
      console.error('  • Check if firewall allows the connection\n');
    } else {
      console.error('Troubleshooting tips:');
      console.error('  • Verify Redis host and port are correct');
      console.error('  • Check if Redis is running');
      console.error('  • Verify Redis password if required');
      console.error('  • Check firewall settings\n');
    }
    
    process.exit(1);
  }
}
async function cleanup() {
  if (redisClient) {
    await redisClient.quit();
  }
  
  if (sshTunnel) {
    sshTunnel.server.close();
    sshTunnel.conn.end();
  }
  
  process.exit(0);
}

async function main() {
  // If test connection flag is present, run test and exit
  if (shouldTestConnection) {
    await testConnection();
    return;
  }

  // Otherwise, start the normal UI
  try {
    setupUI();
    await connectRedis();
    await loadKeys();
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

main();
