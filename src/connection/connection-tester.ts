import { createClient } from 'redis';
import { createTunnel } from 'tunnel-ssh';
import type { RedisConfig } from '../config/redis-config.js';
import type { SSHConfig } from '../config/ssh-config.js';
import { displayConnectionTestBanner, formatConfigLine } from '../utils/banner.js';

/**
 * Test Redis connection with optional SSH tunnel
 * Displays diagnostic information and exits the process
 * 
 * @param envFile - Name of the environment file being used
 * @param redisConfig - Redis configuration
 * @param sshConfig - SSH configuration (null for direct connection)
 */
export async function testConnection(
  envFile: string,
  redisConfig: RedisConfig,
  sshConfig: SSHConfig | null
): Promise<void> {
  displayConnectionTestBanner();
  
  console.log('\n┌───────────────────────────────────────────────────────────────┐');
  console.log('│  CONNECTION CONFIGURATION                                     │');
  console.log('└───────────────────────────────────────────────────────────────┘\n');
  
  formatConfigLine('Environment', envFile, '📋');
  formatConfigLine('SSH Tunnel', sshConfig !== null ? 'Enabled' : 'Disabled', '🔐');
  
  if (sshConfig) {
    formatConfigLine('SSH Host', `${sshConfig.host}:${sshConfig.port}`, '🌐');
    formatConfigLine('SSH User', sshConfig.username, '👤');
    formatConfigLine('SSH Auth', sshConfig.privateKey ? 'Private Key' : 'Password', '🔑');
    formatConfigLine('Redis Target', `${redisConfig.host}:${redisConfig.port}`, '🎯');
  } else {
    formatConfigLine('Redis Host', `${redisConfig.host}:${redisConfig.port}`, '🌐');
  }
  
  formatConfigLine('Redis Database', `DB ${redisConfig.database}`, '💾');
  
  console.log('\n┌───────────────────────────────────────────────────────────────┐');
  console.log('│  CONNECTION TEST                                              │');
  console.log('└───────────────────────────────────────────────────────────────┘\n');

  try {
    // Test SSH tunnel if enabled
    if (sshConfig) {
      console.log('  [1/3] 📡 Establishing SSH tunnel...');
      
      const tunnelOptions = { autoClose: true, reconnectOnError: false };
      const serverOptions = { port: 0 };
      const sshOptions: any = {
        host: sshConfig.host,
        port: sshConfig.port,
        username: sshConfig.username
      };

      if (sshConfig.privateKey) {
        sshOptions.privateKey = sshConfig.privateKey;
        if (sshConfig.passphrase) {
          sshOptions.passphrase = sshConfig.passphrase;
        }
      } else if (sshConfig.password) {
        sshOptions.password = sshConfig.password;
      }

      const forwardOptions = {
        srcAddr: '127.0.0.1',
        srcPort: 0,
        dstAddr: redisConfig.host,
        dstPort: redisConfig.port
      };

      const [server, conn] = await createTunnel(
        tunnelOptions,
        serverOptions,
        sshOptions,
        forwardOptions
      );

      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Failed to get server address');
      }

      console.log(`        ✅ SSH tunnel established on local port ${address.port}`);

      // Connect to Redis through tunnel
      console.log('\n  [2/3] 🔌 Connecting to Redis through tunnel...');
      const config: any = {
        socket: {
          host: '127.0.0.1',
          port: address.port
        }
      };

      if (redisConfig.password) {
        config.password = redisConfig.password;
      }
      if (redisConfig.database) {
        config.database = redisConfig.database;
      }

      const client = createClient(config);
      await client.connect();
      
      // Test Redis connection
      const pong = await client.ping();
      console.log(`        ✅ Redis connection successful (${pong})`);
      
      console.log('\n  [3/3] 📊 Gathering database information...');
      
      // Get Redis info
      const info = await client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
      const keys = await client.dbSize();
      
      console.log(`        ✓ Redis version: ${version}`);
      console.log(`        ✓ Database: ${redisConfig.database}`);
      console.log(`        ✓ Total keys: ${keys.toLocaleString()}`);
      
      await client.quit();
      server.close();
      conn.end();
      
    } else {
      // Direct connection
      console.log('  [1/2] 🔌 Connecting to Redis...');
      const config: any = {
        socket: {
          host: redisConfig.host,
          port: redisConfig.port
        }
      };

      if (redisConfig.password) {
        config.password = redisConfig.password;
      }
      if (redisConfig.database) {
        config.database = redisConfig.database;
      }

      const client = createClient(config);
      await client.connect();
      
      const pong = await client.ping();
      console.log(`        ✅ Redis connection successful (${pong})`);
      
      console.log('\n  [2/2] 📊 Gathering database information...');
      
      const info = await client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
      const keys = await client.dbSize();
      
      console.log(`        ✓ Redis version: ${version}`);
      console.log(`        ✓ Database: ${redisConfig.database}`);
      console.log(`        ✓ Total keys: ${keys.toLocaleString()}`);
      
      await client.quit();
    }
    
    console.log('\n┌───────────────────────────────────────────────────────────────┐');
    console.log('│  ✅ CONNECTION TEST PASSED                                    │');
    console.log('└───────────────────────────────────────────────────────────────┘');
    console.log('\n  All systems operational. Ready to browse Redis keys! 🚀\n');
    process.exit(0);
    
  } catch (err) {
    const error = err as Error;
    console.log('\n┌───────────────────────────────────────────────────────────────┐');
    console.log('│  ❌ CONNECTION TEST FAILED                                    │');
    console.log('└───────────────────────────────────────────────────────────────┘\n');
    console.error(`  Error: ${error.message}\n`);
    
    console.log('┌───────────────────────────────────────────────────────────────┐');
    console.log('│  TROUBLESHOOTING TIPS                                         │');
    console.log('└───────────────────────────────────────────────────────────────┘\n');
    
    if (sshConfig) {
      console.log('  🔍 SSH Connection Issues:');
      console.log('     • Verify SSH host and port are correct');
      console.log('     • Check SSH credentials (username/key/password)');
      console.log('     • Ensure private key file exists and has correct permissions (600)');
      console.log('     • Test manual SSH connection: ssh ' + sshConfig.username + '@' + sshConfig.host);
      console.log('');
      console.log('  🔍 Redis Connection Issues:');
      console.log('     • Verify Redis host/port are accessible from SSH server');
      console.log('     • Check if Redis is running on the remote server');
      console.log('     • Verify firewall allows connection from SSH server to Redis');
      console.log('');
    } else {
      console.log('  🔍 Common Issues:');
      console.log('     • Verify Redis host and port are correct');
      console.log('     • Check if Redis is running: redis-cli ping');
      console.log('     • Verify Redis password if authentication is required');
      console.log('     • Check firewall settings allow connection');
      console.log('     • Ensure Redis is listening on the correct interface');
      console.log('');
    }
    
    process.exit(1);
  }
}
