import mongoose from 'mongoose';
import { User } from './models/index.js';
import { seed } from './seed.js';

// One connection per server process. Next.js re-evaluates modules on hot reload, so the promise lives on globalThis.
const cache = (globalThis.__tutorhubDb ??= { promise: null, memoryServer: null });

async function connect() {
  let uri = process.env.MONGO_URI;
  if (!uri && process.env.NODE_ENV === 'production') {
    // On serverless hosts (Vercel) every instance would get its own throwaway in-memory DB.
    throw new Error('MONGO_URI is not set. Add it to your deployment environment variables.');
  }
  if (!uri) {
    // No database configured (local dev): spin up an in-memory MongoDB so the app runs out of the box.
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    cache.memoryServer = await MongoMemoryServer.create();
    uri = cache.memoryServer.getUri('tutorhub');
    console.log('⚠️  MONGO_URI not set – using in-memory MongoDB (data resets on restart)');
  }
  // connect() is retried after failures; register the listeners only once.
  if (!cache.listening) {
    cache.listening = true;
    mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected – requests will return 503 until it reconnects'));
    mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
  }

  // dbName applies when the URI has no database path (e.g. a bare Atlas cluster URL).
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME || 'tutorhub', serverSelectionTimeoutMS: 8000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  if (process.env.SEED_ON_EMPTY !== 'false' && (await User.estimatedDocumentCount()) === 0) {
    const r = await seed({ reset: false });
    console.log('Seeded demo data:', r);
  }
}

export function connectDB() {
  // Retry on the next request if the first attempt failed (e.g. Mongo not started yet).
  cache.promise ??= connect().catch((e) => {
    cache.promise = null;
    throw e;
  });
  return cache.promise;
}

export const isConnected = () => mongoose.connection.readyState === 1;
