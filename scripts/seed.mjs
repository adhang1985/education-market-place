// Wipes and re-seeds the database in MONGO_URI with demo data. Run with: npm run seed
import mongoose from 'mongoose';
import { seed } from '../src/server/seed.js';

if (!process.env.MONGO_URI) {
  console.error('Set MONGO_URI in .env.local to seed a persistent database (the in-memory DB seeds itself on start).');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || 'tutorhub' });
const result = await seed({ reset: true });
console.log('Database reset and seeded:', result);
await mongoose.disconnect();
