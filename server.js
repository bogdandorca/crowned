const { createServer } = require('./src/server/create-server');

if (require.main === module) {
  require('dotenv').config();

  const PORT = Number(process.env.PORT) || 8765;
  const HOST = process.env.HOST || '0.0.0.0';
  const server = createServer({ port: PORT });

  server.listen(PORT, HOST, () => {
    console.log(`Crowned server listening on http://${HOST}:${PORT}`);
  });

  process.on('SIGINT', () => server.close(() => process.exit(0)));
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}

module.exports = {
  createServer,
};
