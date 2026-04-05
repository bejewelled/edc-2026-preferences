<script>
  import { currentUser } from '$lib/stores.js';
  import { artistKey } from '$lib/data/artists.js';

  let { day, stage, artist, preferences = [], onPreferenceChange } = $props();

  const key = $derived(artistKey(day, stage, artist));
  const myPref = $derived(preferences.find((p) => p.memberId === $currentUser?._id));
  const others = $derived(preferences.filter((p) => p.memberId !== $currentUser?._id));
  const hotCount = $derived(preferences.filter((p) => p.priority <= 3).length);
  const isHot = $derived(hotCount >= 3);

  let editing = $state(false);
  let saving = $state(false);

  const PRIORITY_LABELS = { 1: '!!!', 2: '!!', 3: '!', 4: '~' };
  const PRIORITY_CLASSES = { 1: 'p1', 2: 'p2', 3: 'p3', 4: 'p4' };

  async function setPriority(val) {
    if (!$currentUser || saving) return;
    saving = true;
    if (val === null) {
      await fetch('/api/preferences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: $currentUser._id, artistKey: key })
      });
    } else {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: $currentUser._id, artistKey: key, priority: val })
      });
    }
    saving = false;
    editing = false;
    onPreferenceChange?.();
  }
</script>

<div class="card" class:has-edit={$currentUser}>
  <div class="card-header">
    <p class="artist-name" class:hot={isHot}>{artist}</p>
    {#if $currentUser}
      <button
        class="edit-btn"
        class:active={editing}
        onclick={() => (editing = !editing)}
        aria-label="Edit priority"
      >✎</button>
    {/if}
  </div>

  {#if preferences.length}
    <div class="prefs">
      {#each others as pref}
        <span class="badge {PRIORITY_CLASSES[pref.priority]}">
          {pref.name} <span class="pnum">{PRIORITY_LABELS[pref.priority]}</span>
        </span>
      {/each}
      {#if myPref}
        <span class="badge {PRIORITY_CLASSES[myPref.priority]} mine">
          {$currentUser.name} <span class="pnum">{PRIORITY_LABELS[myPref.priority]}</span>
        </span>
      {/if}
    </div>
  {/if}

  {#if editing}
    <div class="edit-row">
      <button class="prio-btn p1-btn" onclick={() => setPriority(1)} disabled={saving} class:selected={myPref?.priority === 1}>HIGH [!!!]</button>
      <button class="prio-btn p2-btn" onclick={() => setPriority(2)} disabled={saving} class:selected={myPref?.priority === 2}>Medium [!!]</button>
      <button class="prio-btn p3-btn" onclick={() => setPriority(3)} disabled={saving} class:selected={myPref?.priority === 3}>Low [!]</button>
      {#if myPref}
        <button class="prio-btn clear-btn" onclick={() => setPriority(null)} disabled={saving}>✕</button>
      {/if}
    </div>
    <div class="edit-row">
      <button class="prio-btn p4-btn" onclick={() => setPriority(4)} disabled={saving} class:selected={myPref?.priority === 4}>Maybe [~]</button>
    </div>
  {/if}
</div>

<style>
  .card {
    background: #12122a;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
    max-width: 270px;
    min-width: 200px;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .artist-name {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #e2d9f3;
    line-height: 1.3;
    white-space: normal;
    word-break: break-word;
    transition: color 0.2s;
  }

  .artist-name.hot {
    color: #f97316;
    text-shadow: 0 0 8px #f9731666;
  }

  .edit-btn {
    background: none;
    border: 1px solid transparent;
    border-radius: 4px;
    color: #555;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0.05rem 0.3rem;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.15s, border-color 0.15s;
    transform: scaleX(-1);
  }

  .edit-btn:hover, .edit-btn.active {
    color: #c084fc;
    border-color: #c084fc44;
  }

  .prefs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    padding: 0.2rem 0.45rem;
    border-radius: 4px;
    white-space: nowrap;
    font-weight: 500;
  }

  .pnum {
    font-weight: 700;
    font-size: 0.75rem;
  }

  /* Priority 1 — green */
  .p1 { background: #14532d55; color: #35ed79; border: 1px solid #166534; }
  /* Priority 2 — yellow */
  .p2 { background: #71350055; color: #fde047; border: 1px solid #854d0e; }
  /* Priority 3 — light blue */
  .p3 { background: #0c2a4a55; color: #93c5fd; border: 1px solid #1e4a7a; }
  /* Priority 4 — gray  */
  .p4 { background: #1a1a1a55; color: #9ca3af; border: 1px solid #374151; }

  .mine { font-style: italic; }

  .edit-row {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    padding-top: 0.15rem;
  }

  .prio-btn {
    border: 1px solid transparent;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    transition: all 0.1s;
    opacity: 0.7;
  }

  .prio-btn:disabled { cursor: wait; opacity: 0.4; }

  .prio-btn.selected { opacity: 1; box-shadow: 0 0 0 2px #fff3; }

  .p1-btn { background: #14532d88; color: #86efac; border-color: #166534; }
  .p1-btn:hover:not(:disabled), .p1-btn.selected { background: #166534; opacity: 1; }

  .p2-btn { background: #71350088; color: #fde047; border-color: #854d0e; }
  .p2-btn:hover:not(:disabled), .p2-btn.selected { background: #854d0e; opacity: 1; }

  .p3-btn { background: #0c2a4a88; color: #93c5fd; border-color: #1e4a7a; }
  .p3-btn:hover:not(:disabled), .p3-btn.selected { background: #1e4a7a; opacity: 1; }

  .p4-btn { background: #1a1a1a88; color: #9ca3af; border-color: #374151; font-weight: 400; }
  .p4-btn:hover:not(:disabled), .p4-btn.selected { background: #374151; opacity: 1; }

  .clear-btn {
    background: #1a1a2e;
    color: #666;
    border-color: #333;
    margin-left: auto;
    font-weight: 400;
  }

  .clear-btn:hover:not(:disabled) { color: #f87171; border-color: #7f1d1d; }
</style>
