import { json } from '@sveltejs/kit';
import { getRedis, keys } from '$lib/redis.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// POST /api/members — register a new member
export async function POST({ request }) {
  const { name, pin } = await request.json();

  if (!name?.trim() || !/^\d{4}$/.test(pin)) {
    return json({ error: 'Name and 4-digit PIN required.' }, { status: 400 });
  }

  try {
    const redis = getRedis();
    const nameKey = keys.name(name.trim().toLowerCase());
    const existing = await redis.get(nameKey);
    if (existing) {
      return json({ error: 'That name is already taken.' }, { status: 409 });
    }

    const id = randomUUID();
    const pinHash = await bcrypt.hash(pin, 10);

    await redis.set(keys.member(id), JSON.stringify({ name: name.trim(), pinHash }));
    await redis.set(nameKey, id);
    await redis.sadd(keys.members, id);

    return json({ _id: id, name: name.trim() }, { status: 201 });
  } catch (err) {
    console.error('Member creation error:', err);
    return json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
