import Redis from 'ioredis';
import { env } from '$env/dynamic/private';

let client;

export function getRedis() {
  if (!client) {
    client = new Redis(env.REDIS_URL, { lazyConnect: false });
  }
  return client;
}
