import Redis from 'ioredis';
import { env } from '$env/dynamic/private';

let client;

export function getRedis() {
  if (!client) {
    if (!env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    client = new Redis(env.REDIS_URL, {
      lazyConnect: false,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 2,
    });
    client.on('error', (err) => {
      console.error('Redis client error:', err);
      client = null;
    });
  }
  return client;
}

// Namespaced key helpers — all edc-preferences keys are isolated under "edc:"
export const keys = {
  preferences: 'edc:preferences',
  members: 'edc:members',
  member: (id) => `edc:member:${id}`,
  name: (name) => `edc:name:${name}`,
};
