import { json } from '@sveltejs/kit';
import { getRedis, keys } from '$lib/redis.js';

// GET /api/preferences — return all preferences as { artistKey: [{ memberId, name, priority }] }
export async function GET() {
  try {
    const redis = getRedis();

    const [prefsHash, memberIds] = await Promise.all([
      redis.hgetall(keys.preferences),
      redis.smembers(keys.members)
    ]);

    // Resolve all member names in one round-trip
    const memberNames = {};
    if (memberIds.length) {
      const values = await Promise.all(memberIds.map(id => redis.get(keys.member(id))));
      memberIds.forEach((id, i) => {
        if (values[i]) memberNames[id] = JSON.parse(values[i]).name;
      });
    }

    // Build result grouped by artistKey
    const result = {};
    if (prefsHash) {
      for (const [field, priority] of Object.entries(prefsHash)) {
        const sep = field.indexOf('|');
        const memberId = field.slice(0, sep);
        const artistKey = field.slice(sep + 1);
        if (!result[artistKey]) result[artistKey] = [];
        result[artistKey].push({
          memberId,
          name: memberNames[memberId] ?? 'Unknown',
          priority: Number(priority)
        });
      }
    }

    for (const key of Object.keys(result)) {
      result[key].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
    }

    return json(result);
  } catch (err) {
    console.error('Preferences GET error:', err);
    return json({ error: 'Server error.' }, { status: 500 });
  }
}

// PUT /api/preferences — set or update a preference
export async function PUT({ request }) {
  const { memberId, artistKey, priority } = await request.json();

  if (!memberId || !artistKey || ![1, 2, 3, 4].includes(priority)) {
    return json({ error: 'memberId, artistKey, and priority (1–4) required.' }, { status: 400 });
  }

  try {
    const redis = getRedis();
    await redis.hset(keys.preferences, `${memberId}|${artistKey}`, priority);
    return json({ ok: true });
  } catch (err) {
    console.error('Preferences PUT error:', err);
    return json({ error: 'Server error.' }, { status: 500 });
  }
}

// DELETE /api/preferences — remove a preference
export async function DELETE({ request }) {
  const { memberId, artistKey } = await request.json();

  if (!memberId || !artistKey) {
    return json({ error: 'memberId and artistKey required.' }, { status: 400 });
  }

  try {
    const redis = getRedis();
    await redis.hdel(keys.preferences, `${memberId}|${artistKey}`);
    return json({ ok: true });
  } catch (err) {
    console.error('Preferences DELETE error:', err);
    return json({ error: 'Server error.' }, { status: 500 });
  }
}
