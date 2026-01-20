import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();

app.listen(config.server.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Sales Coaching AI Server                                 ║
║                                                               ║
║   Environment: ${config.server.nodeEnv.padEnd(43)}║
║   Port: ${String(config.server.port).padEnd(51)}║
║   URL: http://localhost:${config.server.port}${' '.repeat(35)}║
║                                                               ║
║   Endpoints:                                                  ║
║   - POST /api/v1/chat         Main chat interface             ║
║   - GET  /api/v1/agents       List agents                     ║
║   - GET  /api/v1/team/summary Team performance                ║
║   - POST /api/v1/search       Semantic search                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});
