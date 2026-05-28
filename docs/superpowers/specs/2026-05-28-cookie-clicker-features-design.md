# Doe Clicker — Cookie Clicker Feature Adaptations

**Date:** 2026-05-28  
**Status:** Approved  
**Approach:** B — Shared infrastructure, one pass

---

## Overview

Add 6 features inspired by Cookie Clicker, adapted to Doe Clicker's phosphor-green cosmic horror aesthetic. All 6 share a common `activeBuffs[]` infrastructure added to GameState in a single state migration pass.

---

## Features

| # | Feature | Type |
|---|---------|------|
| 1 | Void Signal Ticker | Atmosphere |
| 2 | Active Effects Bar | UI |
| 3 | Void Resonance Bar | UI |
| 4 | Rich Conduit Tooltips | UI |
| 5 | Void Leeches | Mechanic |
| 6 | Null Fracture Event | Mechanic |

---

## Architecture

### State Changes

New fields added to `GameState` in `src/types.ts`:

```ts
activeBuffs: ActiveBuff[]   // timed multiplier effects
leeches: VoidLeech[]        // attached void parasites
resonanceTier: number       // 0–7, derived from achievement count
```

New types added to `src/types.ts`:

```ts
export interface ActiveBuff {
  id: string
  label: string                // display text e.g. "RESONANT FRENZY ×7"
  type: 'frenzy' | 'click-surge' | 'windfall' | 'void-flush' | 'null-drain'
  dpsMultiplier?: number       // applied to doePerSecond during tick
  clickMultiplier?: number     // applied to doePerClick
  expiresAt: number            // absolute Date.now() timestamp
}

export interface VoidLeech {
  id: string
  angle: number                // degrees 0–360, position around Doe SVG
  attachedAt: number           // timestamp
  absorbed: number             // doe drained so far (accumulates each tick)
}
```

New `GameAction` variants:

```ts
| { type: 'APPLY_BUFF'; buff: ActiveBuff }
| { type: 'SPAWN_LEECH'; leech: VoidLeech }
| { type: 'POP_LEECH'; leechId: string }
| { type: 'CATCH_NULL_FRACTURE'; bonus: boolean }
```

### Reducer Changes (`gameReducer.ts`)

**`TICK`** (extended):
- Expire buffs: filter `activeBuffs` where `expiresAt > Date.now()`
- Drain leeches: for each leech, `absorbed += doePerSecond * 0.05 * delta`; subtract from `doe`
- `resonanceTier`: computed as `Math.min(7, Math.floor(achievements.size / 5))` — every 5 achievements = +1 tier

**`APPLY_BUFF`**: push buff; if a buff of the same `type` already exists, replace it (no stacking, refresh duration).

**`POP_LEECH`**: remove leech from array, add `leech.absorbed * 1.1` to `doe`.

**`CATCH_NULL_FRACTURE`**: if `bonus === true`, dispatch `APPLY_BUFF` with `{ type: 'windfall', dpsMultiplier: 15, expiresAt: now + 30_000, label: 'NULL WINDFALL ×15' }`; if `bonus === false`, dispatch `APPLY_BUFF` with `{ type: 'null-drain', dpsMultiplier: 0.5, expiresAt: now + 15_000, label: 'VOID DRAIN −50%' }`.

**`CATCH_GOLDEN`** (updated): existing effects now also call `APPLY_BUFF` to populate `activeBuffs[]` for the buffs bar display. The `ActiveBuff` created here has **no `dpsMultiplier`** — it is display-only. The actual multiplier continues to be applied through the existing `goldenMultiplier` tick path to avoid double-counting. Existing `goldenMultiplier` tick logic is preserved unchanged.

### `computeDps` Change

Multiply final DPS by `(1 + state.resonanceTier * 0.02)`.  
Maximum bonus: +14% at tier 7 (35 achievements).

### Persistence

`activeBuffs` and `leeches` serialize directly as arrays. On load, filter out any `activeBuffs` where `expiresAt < Date.now()` (expired during offline time). Leeches persist — they were absorbing while you were away, so `absorbed` resumes from saved value.

---

## Components

### 1. `SignalTicker.tsx` — Void Signal Ticker

**Placement:** Full-width strip between HUD and BuffsBar.

**Behavior:**
- Scrolling marquee (CSS `animation: ticker-scroll linear infinite`)
- Message sources (cycled in order):
  1. Recent `signalLog` entries (last 5, stripped of brackets)
  2. Live game stats: `"X doe accumulated"`, `"DPS: Y"`, `"X leeches attached"`
  3. Static lore phrases (20–30 strings, cosmic horror tone)
- Scroll speed: 60s for full cycle at normal width
- Separator: ` ◈ ` between messages

**Implementation:** Single `div` with `white-space: nowrap; overflow: hidden`. Inner span runs the animation. Rebuild message string whenever `signalLog` changes (useMemo).

---

### 2. `BuffsBar.tsx` — Active Effects Bar

**Placement:** Full-width strip between SignalTicker and the 3-column layout. Renders `null` when `activeBuffs` is empty.

**Each buff chip:**
- Label + multiplier text (VT323 font)
- Thin bottom border that drains left-to-right as a countdown (CSS width animation from 100% → 0% over remaining duration)
- Color coding: `frenzy`/`windfall` → amber; `click-surge` → cyan; `void-flush` → phosphor green; `null-drain` → crimson

**Implementation:** `useEffect` recalculates remaining duration on mount. Each chip sets `animationDuration` to `(expiresAt - Date.now()) / 1000` seconds. No JS timer needed — pure CSS.

---

### 3. `ResonanceBar.tsx` — Void Resonance Bar

**Placement:** Inside left panel, below the per-second/per-click stats row, above DoeClickable.

**Behavior:**
- 6px tall bar, full panel width
- Fill % = `(achievements.size % 5) / 5 * 100` (progress toward next tier)
- Color shifts per tier: grey → purple → violet → magenta → crimson → amber → white (transcendent)
- Tier name shown above bar: `"TIER 3 — FRACTURED ECHO  [+6% DPS]"`
- At tier 7 (35 achievements): bar pulses, label reads `"VOID RESONANCE — MAXIMUM"`

**Tier table:**

| Tier | Achievements | Color | Label |
|------|-------------|-------|-------|
| 0 | 0–4 | #444 | INERT |
| 1 | 5–9 | #6428ff | FAINT SIGNAL |
| 2 | 10–14 | #9040ff | RESONANT |
| 3 | 15–19 | #b464ff | FRACTURED ECHO |
| 4 | 20–24 | #ff3cb4 | DEEP CONTACT |
| 5 | 25–29 | #ff5050 | CONVERGENCE |
| 6 | 30–34 | #ffc200 | VOID CHORUS |
| 7 | 35+ | #ffffff | MAXIMUM — pulses |

---

### 4. Rich Conduit Tooltips

**Placement:** Hover panel, appears to the left of the hovered conduit row (or above if near bottom of panel).

**No new component file** — inline hover state in `ConduitsPanel.tsx` via `useState<string | null>(hoveredId)`.

**Tooltip content:**
- Conduit name + owned count (VT323, amber)
- `▸ X/s base × N owned = Y/s total`
- `▸ Z% of total output` (conduit DPS / totalDps * 100)
- Efficiency rating: `cost-to-DPS ratio` shown as 5-block bar (████░)
- Next upgrade threshold (if an upgrade requires this conduit, show "Upgrade unlocks at N owned")
- Flavor lore snippet (italic, pale, from `conduit.description`)

**Positioning:** `position: fixed` tooltip, coordinates from `onMouseEnter` event's `currentTarget.getBoundingClientRect()`.

---

### 5. `VoidLeechLayer.tsx` — Void Leeches

**Placement:** Absolutely positioned container over `DoeClickable`, same bounding box.

**Visual:**
- Small (~16px) pulsing circles at `angle` position around the Doe SVG edge
- Color: deep purple `rgba(120,0,180,0.9)` with violet glow
- Symbol inside: `▲` (upward drain indicator)
- Pulse animation: scale 1 → 1.2 → 1, 2s loop
- Count indicator: `"N LEECHES"` text in corner when any attached

**Interaction:**
- Click leech → `dispatch({ type: 'POP_LEECH', leechId })` + toast `"[ LEECH PURGED +X DOE ]"`
- On pop: brief expand + fade animation (Framer Motion `animate={{ scale: [1, 2], opacity: [1, 0] }}`)

**Spawn logic (GameProvider):**
- Unlock threshold: `totalDoeEver >= 1e4` (early Act II)
- Timer: random 3–5 min interval, respawns after each leech is either popped or after 10 min auto-expire
- Max 6 leeches simultaneously
- On spawn: random `angle` that doesn't conflict with existing leeches (±30° from any existing)

**Signal log entry on spawn:** `"VOID LEECH DETECTED — PURGE RECOMMENDED"` (amber)

---

### 6. `NullFractureEvent.tsx` — Null Fracture

**Placement:** Same layer as `GoldenDoeEvent` (fixed, full-viewport, pointer-events on shimmer only).

**Visual:**
- Crimson shimmer: `✦` icon, color `#ff2050`, glow `rgba(200,0,50,0.6)`
- Slightly smaller than golden doe (0.85× scale)
- Faster pulse animation (1.2s vs 2s)
- Tooltip on hover: `"NULL FRACTURE — RISK: 40% VOID DRAIN"`

**Behavior:**
- Spawned by GameProvider: ~25% of golden-doe spawn rolls emit a null fracture instead
- Unlock: `totalDoeEver >= 1e7` (Act III+)
- Despawn timeout: 12s (vs 15s for golden doe)
- On click: `Math.random() < 0.6` → bonus (windfall ×15 for 30s); else → penalty (−50% DPS for 15s)
- Both outcomes dispatch `APPLY_BUFF` → appears in BuffsBar

**Outcomes:**
- Bonus toast: `"[ NULL FRACTURE — WINDFALL ×15 ]"` (amber)  
- Penalty toast: `"[ NULL FRACTURE — VOID DRAIN ACTIVE ]"` (crimson)
- Signal log entry for both outcomes

---

## UI Layout (updated)

```
┌─────────────────────────────────────────────────────────────┐
│  HUD bar                                                     │
├─────────────────────────────────────────────────────────────┤
│  SignalTicker  [scrolling lore/stats]               NEW     │
├─────────────────────────────────────────────────────────────┤
│  BuffsBar  [RESONANT FRENZY ×7 ████] [NULL DRAIN ██░░]  NEW │
│  (hidden when no active buffs)                              │
├──────────────────┬────────────────┬────────────────────────┤
│  doe count       │  [ UPGRADES ]  │  [ CONDUIT ARRAY ]     │
│  per-sec/click   │  [ CODEX    ]  │                        │
│  ResonanceBar NEW│  [ ACHIEVE  ]  │  (conduit rows with    │
│  DoeClickable    │  [ RECORDS  ]  │   hover tooltips) NEW  │
│  + VoidLeeches NEW              │                        │
│  lore quote      │  SignalLog     │                        │
└──────────────────┴────────────────┴────────────────────────┘
```

---

## Error Handling & Edge Cases

- **Leech drains more than current doe:** clamp `doe` floor at 0; leech `absorbed` still accumulates
- **Multiple null-drain buffs:** APPLY_BUFF replaces existing `null-drain` type — no stacking
- **Load with expired buffs:** filter on LOAD_STATE, before first render
- **Leeches offline:** `absorbed` saved, but do NOT simulate offline drain for leeches (would be punishing). Resume from saved value.
- **Tooltip overflow:** cap tooltip width at 240px; since the conduit panel is always the rightmost column, tooltips always render to the left of the hovered row (never to the right)

---

## Testing

No test suite — verify by running `npm run dev` and confirming:
1. Golden doe catch shows chip in BuffsBar with draining countdown
2. Leech appears, clicking it removes it + credits doe
3. Null fracture spawns crimson, both outcome toasts fire
4. Resonance bar fills as achievements unlock, DPS increases
5. Ticker scrolls continuously, updates when new signal log entries appear
6. Conduit hover tooltip shows correct DPS% and lore
