import blessed from 'blessed';

/**
 * Creates and initializes the main blessed screen
 * Lines 429-436, 632-633 from original
 */
export function createScreen(envFile: string): blessed.Widgets.Screen {
  const envName = envFile === '.env' 
    ? 'Redis Browser' 
    : `Redis Browser - ${envFile.replace('.env.', '').toUpperCase()}`;
  
  const screen = blessed.screen({
    smartCSR: true,
    title: envName
  });

  return screen;
}
