import { json } from '@sveltejs/kit';
import { getRedis, keys } from '$lib/redis.js';
import bcrypt from 'bcryptjs';

// POST /api/auth — log in with name + PIN
export async function POST({ request }) {
  const { name, pin } = await request.json();

  if (!name?.trim() || !pin) {
    return json({ error: 'Name and PIN required.' }, { status: 400 });
  }

  try {
    const redis = getRedis();
    const memberId = await redis.get(keys.name(name.trim().toLowerCase()));
    if (!memberId) {
      return json({ error: 'No account found with that name.' }, { status: 404 });
    }

    const memberJson = await redis.get(keys.member(memberId));
    const member = JSON.parse(memberJson);

    const valid = await bcrypt.compare(pin, member.pinHash);
    if (!valid) {
      return json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    return json({ _id: memberId, name: member.name });
  } catch (err) {
    console.error('Auth error:', err);
    return json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
