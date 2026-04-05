<script>
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/stores.js';
  import { ARTISTS, STAGES, DAYS, artistKey } from '$lib/data/artists.js';
  import StageColumn from '$lib/components/StageColumn.svelte';

  let activeDay = $state('FRIDAY');
  let preferences = $state({});
  let loading = $state(true);
  let view = $state('grid'); // 'grid' | 'picks'
  let expandedRows = $state(new Set());

  const DAY_LABELS = { FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday' };
  const PRIORITY_LABELS = { 1: 'HIGH !!!', 2: 'Medium !!', 3: 'Low !', 4: 'Maybe ~' };
  const PRIORITY_CLASSES = { 1: 'p1', 2: 'p2', 3: 'p3', 4: 'p4' };

  async function loadPreferences() {
    const res = await fetch('/api/preferences');
    preferences = await res.json();
    loading = false;
  }

  onMount(loadPreferences);

  const myPicks = $derived.by(() => {
    if (!$currentUser) return [];
    const result = [];
    for (const day of DAYS) {
      const dayStages = [];
      for (const stage of STAGES) {
        const stageEntries = [];
        for (const artist of (ARTISTS[day][stage] ?? [])) {
          const key = artistKey(day, stage, artist);
          const prefs = preferences[key] ?? [];
          const mine = prefs.find(p => p.memberId === $currentUser._id);
          if (mine) {
            stageEntries.push({
              artist,
              key,
              priority: mine.priority,
              others: prefs.filter(p => p.memberId !== $currentUser._id)
            });
          }
        }
        if (stageEntries.length) dayStages.push({ stage, entries: stageEntries });
      }
      if (dayStages.length) result.push({ day, label: DAY_LABELS[day], stages: dayStages });
    }
    return result;
  });

  function toggleRow(key) {
    const next = new Set(expandedRows);
    if (next.has(key)) next.delete(key); else next.add(key);
    expandedRows = next;
  }
</script>

<svelte:head>
  <title>EDC 2026 Preferences</title>
</svelte:head>

<div class="page">
  <div class="top-bar">
    <div class="day-tabs" class:hidden={view === 'picks'}>
      {#each DAYS as day}
        <button
          class="day-tab"
          class:active={activeDay === day}
          onclick={() => (activeDay = day)}
        >
          {DAY_LABELS[day]}
        </button>
      {/each}
    </div>

    {#if $currentUser}
      <div class="view-toggle">
        <button class="view-btn" class:active={view === 'grid'} onclick={() => (view = 'grid')}>Grid</button>
        <button class="view-btn" class:active={view === 'picks'} onclick={() => (view = 'picks')}>My Picks</button>
      </div>
    {/if}
  </div>

  {#if loading}
    <p class="loading">Loading…</p>
  {:else if view === 'picks'}
    {#if myPicks.length === 0}
      <p class="empty">You haven't added any preferences yet. Use the Grid view to pick artists.</p>
    {:else}
      <div class="picks-view">
        {#each myPicks as { label, stages }}
          <div class="day-section">
            <h2 class="day-heading">{label}</h2>
            {#each stages as { stage, entries }}
              <div class="stage-section">
                <h3 class="stage-heading">{stage}</h3>
                <table>
                  <colgroup>
                    <col />
                    <col />
                    <col />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Artist</th>
                      <th>Priority</th>
                      <th>Others</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each entries as { artist, key, priority, others }}
                      <tr class="artist-row">
                        <td class="artist-cell">{artist}</td>
                        <td><span class="prio-badge {PRIORITY_CLASSES[priority]}">{PRIORITY_LABELS[priority]}</span></td>
                        <td class="others-cell">
                          {#if others.length}
                            <button class="toggle-btn" onclick={() => toggleRow(key)}>
                              {expandedRows.has(key) ? '▲' : '▼'} {others.length}
                            </button>
                          {:else}
                            <span class="none">—</span>
                          {/if}
                        </td>
                      </tr>
                      {#if expandedRows.has(key) && others.length}
                        <tr class="others-row">
                          <td colspan="3">
                            <div class="others-list">
                              {#each others.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name)) as o}
                                <span class="badge {PRIORITY_CLASSES[o.priority]}">
                                  {o.name} <span class="pnum">{PRIORITY_LABELS[o.priority].split(' ')[1]}</span>
                                </span>
                              {/each}
                            </div>
                          </td>
                        </tr>
                      {/if}
                    {/each}
                  </tbody>
                </table>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="grid">
      {#each STAGES as stage}
        {#if ARTISTS[activeDay][stage]?.length}
          <StageColumn
            day={activeDay}
            {stage}
            artists={ARTISTS[activeDay][stage]}
            {preferences}
            onPreferenceChange={loadPreferences}
          />
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .day-tabs {
    display: flex;
    gap: 0.5rem;
  }

  .day-tabs.hidden {
    visibility: hidden;
    pointer-events: none;
  }

  .day-tab {
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    border: 1px solid #2a2a4a;
    background: transparent;
    color: #aaa;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.03em;
  }

  .day-tab.active {
    background: #1e0a3c;
    border-color: #c084fc;
    color: #c084fc;
  }

  .day-tab:hover:not(.active) {
    border-color: #555;
    color: #ddd;
  }

  .view-toggle {
    display: flex;
    gap: 0.25rem;
    background: #0f0f1a;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 0.2rem;
  }

  .view-btn {
    padding: 0.35rem 1rem;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #888;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .view-btn.active {
    background: #c084fc22;
    color: #c084fc;
  }

  .view-btn:hover:not(.active) { color: #ccc; }

  .loading, .empty {
    color: #666;
    font-style: italic;
  }

  .grid {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding-bottom: 1rem;
    align-items: flex-start;
    width: max-content;
  }

  .grid::-webkit-scrollbar { height: 6px; }
  .grid::-webkit-scrollbar-track { background: #0f0f22; border-radius: 3px; }
  .grid::-webkit-scrollbar-thumb { background: #3a3a6a; border-radius: 3px; }

  /* Picks view */
  .picks-view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 720px;
  }

  .day-heading {
    font-size: 1.1rem;
    font-weight: 700;
    color: #c084fc;
    margin: 0 0 0.75rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #2a2a4a;
  }

  .stage-section {
    margin-bottom: 1.25rem;
  }

  .stage-heading {
    font-size: 0.8rem;
    font-weight: 700;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 0.5rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    table-layout: fixed;
  }

  table colgroup col:nth-child(1) { width: 55%; }
  table colgroup col:nth-child(2) { width: 30%; }
  table colgroup col:nth-child(3) { width: 15%; }

  thead th {
    text-align: left;
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid #1e1e3a;
  }

  .artist-row td {
    padding: 0.45rem 0.75rem;
    border-bottom: 1px solid #131328;
    vertical-align: middle;
  }

  .artist-row:last-of-type td { border-bottom: none; }

  .artist-cell {
    color: #e2d9f3;
    font-weight: 500;
  }

  .prio-badge {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 4px;
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .p1 { background: #14532d55; color: #35ed79; border: 1px solid #166534; }
  .p2 { background: #71350055; color: #fde047; border: 1px solid #854d0e; }
  .p3 { background: #0c2a4a55; color: #93c5fd; border: 1px solid #1e4a7a; }
  .p4 { background: #1a1a1a55; color: #9ca3af; border: 1px solid #374151; }

  .others-cell { }

  .toggle-btn {
    background: none;
    border: 1px solid #2a2a4a;
    border-radius: 5px;
    color: #888;
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .toggle-btn:hover { border-color: #c084fc66; color: #c084fc; }

  .none { color: #444; font-size: 0.8rem; }

  .others-row td {
    padding: 0.3rem 0.75rem 0.6rem 0.75rem;
    background: #0c0c1e;
    border-bottom: 1px solid #1e1e3a;
  }

  .others-list {
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
    font-weight: 500;
  }

  .pnum { font-weight: 700; font-size: 0.75rem; }
</style>
