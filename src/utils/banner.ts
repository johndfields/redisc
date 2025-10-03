/**
 * ASCII art banner utilities for REDISC application
 */

/**
 * Display the main REDISC banner
 */
export function displayBanner(): void {
  const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ██████╗ ███████╗██████╗ ██╗███████╗ ██████╗               ║
║     ██╔══██╗██╔════╝██╔══██╗██║██╔════╝██╔════╝               ║
║     ██████╔╝█████╗  ██║  ██║██║███████╗██║                    ║
║     ██╔══██╗██╔══╝  ██║  ██║██║╚════██║██║                    ║
║     ██║  ██║███████╗██████╔╝██║███████║╚██████╗               ║
║     ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝╚══════╝ ╚═════╝               ║
║                                                               ║
║          Terminal Redis Key Browser & Inspector               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;
  console.log(banner);
}

/**
 * Display banner for connection tester
 */
export function displayConnectionTestBanner(): void {
  const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ██████╗ ███████╗██████╗ ██╗███████╗ ██████╗               ║
║     ██╔══██╗██╔════╝██╔══██╗██║██╔════╝██╔════╝               ║
║     ██████╔╝█████╗  ██║  ██║██║███████╗██║                    ║
║     ██╔══██╗██╔══╝  ██║  ██║██║╚════██║██║                    ║
║     ██║  ██║███████╗██████╔╝██║███████║╚██████╗               ║
║     ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝╚══════╝ ╚═════╝               ║
║                                                               ║
║                Connection Test Utility                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;
  console.log(banner);
}

/**
 * Format a configuration line with icon and padding
 */
export function formatConfigLine(label: string, value: string, icon: string = '▸'): void {
  console.log(`  ${icon} ${label.padEnd(20)} ${value}`);
}
