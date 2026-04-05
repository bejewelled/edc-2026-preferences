import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';

let client;
let db;

export async function getDb() {
  if (db) return db;

  client = new MongoClient(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  });
  await client.connect();
  db = client.db('edc2026');
  return db;
}
