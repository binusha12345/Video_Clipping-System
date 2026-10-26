#!/usr/bin/env node
// ============================================================
// Local development MongoDB
//
// Starts a mongod on 127.0.0.1:27017 (the URI the app falls
// back to when MONGODB_URI is unreachable) using a persistent
// data directory, so `npm run dev` works without Atlas or a
// system-wide MongoDB install.
//
//   npm run dev:db
//
// If something is already listening on the port (e.g. a real
// MongoDB), it exits successfully — the app will just use it.
// ============================================================
const net = require('net');
const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = Number(process.env.MONGO_DEV_PORT || 27017);
const DB_PATH = path.resolve(__dirname, '../.mongo-data');

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

(async () => {
  if (await portInUse(PORT)) {
    console.log(`[dev-db] Port ${PORT} is already in use — assuming MongoDB is running.`);
    return;
  }

  fs.mkdirSync(DB_PATH, { recursive: true });

  const server = await MongoMemoryServer.create({
    instance: { port: PORT, ip: '127.0.0.1', dbPath: DB_PATH },
  });

  console.log(`[dev-db] MongoDB running at ${server.getUri()} (data: ${DB_PATH})`);

  const shutdown = async () => {
    await server.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((err) => {
  console.error('[dev-db] Failed to start MongoDB:', err.message);
  process.exit(1);
});
