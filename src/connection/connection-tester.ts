import { createClient } from 'redis';
import { createTunnel } from 'tunnel-ssh';
import type { RedisConfig } from '../config/redis-config.js';
import type { SSHConfig } from '../config/ssh-config.js';

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
  console.log('\n🔍 Testing connection...\n');
  console.log('Configuration:');
  console.log(`  Environment: ${envFile}`);
  console.log(`  Use SSH: ${sshConfig !== null}`);
  
  if (sshConfig) {
    console.log(`  SSH Host: ${sshConfig.host}:${sshConfig.port}`);
    console.log(`  SSH User: ${sshConfig.username}`);
    console.log(`  SSH Auth: ${sshConfig.privateKey ? 'Private Key' : 'Password'}`);
    console.log(`  Redis Target: ${redisConfig.host}:${redisConfig.port}`);
  } else {
    console.log(`  Redis Host: ${redisConfig.host}:${redisConfig.port}`);
  }
  
  console.log(`  Redis DB: ${redisConfig.database}`);
  console.log('');

  try {
    // Test SSH tunnel if enabled
    if (sshConfig) {
      console.log('📡 Establishing SSH tunnel...');
      
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

      console.log(`✅ SSH tunnel established on local port ${address.port}`);

      // Connect to Redis through tunnel
      console.log('🔌 Connecting to Redis through tunnel...');
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
      console.log(`✅ Redis connection successful: ${pong}`);
      
      // Get Redis info
      const info = await client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
      const keys = await client.dbSize();
      
      console.log(`📊 Redis version: ${version}`);
      console.log(`📊 Total keys in DB ${redisConfig.database}: ${keys}`);
      
      await client.quit();
      server.close();
      conn.end();
      
    } else {
      // Direct connection
      console.log('🔌 Connecting to Redis...');
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
      console.log(`✅ Redis connection successful: ${pong}`);
      
      const info = await client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
      const keys = await client.dbSize();
      
      console.log(`📊 Redis version: ${version}`);
      console.log(`📊 Total keys in DB ${redisConfig.database}: ${keys}`);
      
      await client.quit();
    }
    
    console.log('\n✅ Connection test passed!\n');
    process.exit(0);
    
  } catch (err) {
    const error = err as Error;
    console.error('\n❌ Connection test failed!');
    console.error(`Error: ${error.message}\n`);
    
    if (sshConfig) {
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
