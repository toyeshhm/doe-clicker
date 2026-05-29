# Cookie Clicker Feature Adaptations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 Cookie Clicker-inspired features (Signal Ticker, Buffs Bar, Resonance Bar, Rich Tooltips, Void Leeches, Null Fracture) to Doe Clicker using a shared `activeBuffs[]` infrastructure in GameState.

**Architecture:** Extend `GameState` with `activeBuffs: ActiveBuff[]` and `leeches: VoidLeech[]`; update the TICK reducer to drain leeches and expire buffs; add a null fracture spawn path inside the existing golden doe timer in GameContext; mount 5 new components and update 2 existing ones.

**Tech Stack:** React 19, TypeScript, Framer Motion, Tailwind v4, Web Audio API (existing). No new deps.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/types.ts` | Add `ActiveBuff`, `VoidLeech` interfaces; extend `GameState`, `GameAction` |
| Modify | `src/store/gameReducer.ts` | Add APPLY_BUFF, SPAWN_LEECH, POP_LEECH, CATCH_NULL_FRACTURE cases; extend TICK; resonance bonus in computeDps |
| Modify | `src/store/GameContext.tsx` | Add nullFractureEvent state, catchNullFracture, leech spawn timer, null fracture spawn in golden timer; update catchGolden to dispatch APPLY_BUFF for display |
| Create | `src/components/SignalTicker.tsx` | Full-width scrolling lore/stats marquee |
| Create | `src/components/BuffsBar.tsx` | Active timed-effect chips with CSS countdown |
| Create | `src/components/ResonanceBar.tsx` | Achievement-driven iridescent bar with DPS tier bonus |
| Create | `src/components/VoidLeechLayer.tsx` | Leech parasites overlaid on DoeClickable |
| Create | `src/components/NullFractureEvent.tsx` | Crimson risk/reward shimmer event |
| Modify | `src/components/ConduitsPanel.tsx` | Add hover tooltip with DPS%, efficiency, lore |
| Modify | `src/App.tsx` | Mount all new components in layout |

---

## Task 1: Extend types.ts

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add `ActiveBuff` and `VoidLeech` interfaces, extend `GameState` and `GameAction`**

Open `src/types.ts`. After the `ToastMessage` interface (line 79), add:

```ts
export interface ActiveBuff {
  id: string;
  label: string;           // e.g. "RESONANT FRENZY ×7"
  type: 'frenzy' | 'click-surge' | 'windfall' | 'void-flush' | 'null-drain';
  dpsMultiplier?: number;  // multiplied into earned doe each tick (undefined = display-only)
  expiresAt: number;       // absolute Date.now() timestamp
}

export interface VoidLeech {
  id: string;
  angle: number;           // degrees 0–360, polar position around Doe SVG center
  attachedAt: number;      // timestamp
  absorbed: number;        // doe drained so far; player gets 1.1× on pop
}
```

In the `GameState` interface, add two new fields after `lastSaved`:

```ts
  activeBuffs: ActiveBuff[];
  leeches: VoidLeech[];
```

In the `GameAction` union, add four new variants after `| { type: 'DOE_SPEAKS_BONUS' }`:

```ts
  | { type: 'APPLY_BUFF'; buff: ActiveBuff }
  | { type: 'SPAWN_LEECH'; leech: VoidLeech }
  | { type: 'POP_LEECH'; leechId: string }
  | { type: 'CATCH_NULL_FRACTURE'; bonus: boolean }
```

- [ ] **Step 2: Verify TypeScript accepts the new types**

```bash
cd /Users/medikonda/doe-clicker && npm run build 2>&1 | tail -20
```

Expected: build errors only in `gameReducer.ts` (unhandled action types) — that is fine, we fix it next.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add ActiveBuff and VoidLeech types to GameState"
```

---

## Task 2: Update gameReducer.ts

**Files:**
- Modify: `src/store/gameReducer.ts`

- [ ] **Step 1: Update `INITIAL_STATE` with new fields**

In `INITIAL_STATE`, add after `lastSaved: Date.now()`:

```ts
  activeBuffs: [],
  leeches: [],
```

- [ ] **Step 2: Update `computeDps` to apply the Void Resonance bonus**

At the end of `computeDps`, replace the `return` statement:

```ts
  // was:
  return dps * permBonus * stareBonus * fragBonus;

  // becomes:
  const resonanceTier = Math.min(7, Math.floor(state.achievements.size / 5));
  const resonanceBonus = 1 + resonanceTier * 0.02;
  return dps * permBonus * stareBonus * fragBonus * resonanceBonus;
```

- [ ] **Step 3: Extend the `TICK` case to drain leeches and expire buffs**

Replace the entire `TICK` case:

```ts
    case 'TICK': {
      const now = Date.now();
      // Expire old buffs
      const activeBuffs = state.activeBuffs.filter(b => b.expiresAt > now);

      // Compute active buff DPS multiplier (only buffs with dpsMultiplier, e.g. null fracture)
      let buffDpsMult = 1;
      for (const buff of activeBuffs) {
        if (buff.dpsMultiplier !== undefined) buffDpsMult *= buff.dpsMultiplier;
      }

      const dps = computeDps(state);

      // Drain leeches (5% of raw DPS per leech per second, independent of buffs)
      let totalLeechDrain = 0;
      const leeches = state.leeches.map(l => {
        const drain = dps * 0.05 * (action.delta / 1000);
        totalLeechDrain += drain;
        return { ...l, absorbed: l.absorbed + drain };
      });

      const earned = dps * (action.delta / 1000) * (action.goldenMultiplier ?? 1) * buffDpsMult;
      const doeDelta = earned - totalLeechDrain;
      const newDoe = Math.max(0, state.doe + doeDelta);
      // Only count earned (not leech drain) toward totalDoeEver
      const actualEarned = Math.max(0, earned);

      return {
        ...state,
        activeBuffs,
        leeches,
        doe: newDoe,
        totalDoeEver: state.totalDoeEver + actualEarned,
        totalDoeAllTime: state.totalDoeAllTime + actualEarned,
        doePerSecond: dps,
        doePerClick: computeClickValue(state),
        cycleTimePlayed: state.cycleTimePlayed + action.delta / 1000,
        totalTimePlayed: state.totalTimePlayed + action.delta / 1000,
      };
    }
```

- [ ] **Step 4: Add `APPLY_BUFF` case**

After the `TICK` case, add:

```ts
    case 'APPLY_BUFF': {
      // Replace existing buff of same type (no stacking, refresh duration)
      const filtered = state.activeBuffs.filter(b => b.type !== action.buff.type);
      return { ...state, activeBuffs: [...filtered, action.buff] };
    }
```

- [ ] **Step 5: Add `SPAWN_LEECH` case**

```ts
    case 'SPAWN_LEECH':
      return { ...state, leeches: [...state.leeches, action.leech] };
```

- [ ] **Step 6: Add `POP_LEECH` case**

```ts
    case 'POP_LEECH': {
      const leech = state.leeches.find(l => l.id === action.leechId);
      if (!leech) return state;
      const payout = leech.absorbed * 1.1;
      return {
        ...state,
        leeches: state.leeches.filter(l => l.id !== action.leechId),
        doe: state.doe + payout,
        totalDoeEver: state.totalDoeEver + payout,
        totalDoeAllTime: state.totalDoeAllTime + payout,
      };
    }
```

- [ ] **Step 7: Add `CATCH_NULL_FRACTURE` case**

```ts
    case 'CATCH_NULL_FRACTURE': {
      const now = Date.now();
      const buff: ActiveBuff = action.bonus
        ? { id: Math.random().toString(36).slice(2), label: 'NULL WINDFALL ×15', type: 'windfall', dpsMultiplier: 15, expiresAt: now + 30_000 }
        : { id: Math.random().toString(36).slice(2), label: 'VOID DRAIN −50%', type: 'null-drain', dpsMultiplier: 0.5, expiresAt: now + 15_000 };
      const filtered = state.activeBuffs.filter(b => b.type !== buff.type);
      return { ...state, activeBuffs: [...filtered, buff] };
    }
```

- [ ] **Step 8: Add `ActiveBuff` to the import at the top of `gameReducer.ts`**

Change the existing import line:

```ts
// was:
import type { GameState, GameAction, SignalEntry } from '../types';

// becomes:
import type { GameState, GameAction, SignalEntry, ActiveBuff } from '../types';
```

- [ ] **Step 9: Update `LOAD_STATE` to filter expired buffs and default new fields**

Replace `case 'LOAD_STATE': return action.state;` with:

```ts
    case 'LOAD_STATE': {
      const now = Date.now();
      return {
        ...action.state,
        activeBuffs: (action.state.activeBuffs || []).filter((b: ActiveBuff) => b.expiresAt > now),
        leeches: action.state.leeches || [],
      };
    }
```

- [ ] **Step 10: Update `ASCEND` case to clear new fields**

In the `ASCEND` case, the spread of `INITIAL_STATE` already sets `activeBuffs: []` and `leeches: []`, so no change needed there. Verify:

```ts
    case 'ASCEND': {
      const fragments = Math.floor(Math.log10(Math.max(state.totalDoeAllTime, 10)));
      return {
        ...INITIAL_STATE,   // <-- activeBuffs: [], leeches: [] come from here
        cosmicFragments: state.cosmicFragments + fragments,
        // ... rest unchanged
      };
    }
```

- [ ] **Step 11: Verify build passes**

```bash
npm run build 2>&1 | tail -20
```

Expected: errors only for unused new actions in GameContext (that's fine — fixed next task).

- [ ] **Step 12: Commit**

```bash
git add src/store/gameReducer.ts
git commit -m "feat: add buff/leech reducer logic and resonance DPS bonus"
```

---

## Task 3: Update GameContext.tsx

**Files:**
- Modify: `src/store/GameContext.tsx`

- [ ] **Step 1: Add `VoidLeech` to the import at top of `GameContext.tsx`**

Change the existing import:

```ts
// was:
import type { GameState, GameAction, ToastMessage, ClickParticle, GoldenEvent, NullSurge } from '../types';

// becomes:
import type { GameState, GameAction, ToastMessage, ClickParticle, GoldenEvent, NullSurge, VoidLeech } from '../types';
```

- [ ] **Step 2: Add `nullFractureEvent` state and expose it in context interface**

At the top of `GameProvider`, after `const [goldenEvent, setGoldenEvent] = useState<GoldenEvent | null>(null);` add:

```ts
  const [nullFractureEvent, setNullFractureEvent] = useState<GoldenEvent | null>(null);
```

In the `GameContextValue` interface (around line 9), add after `goldenEvent`:

```ts
  nullFractureEvent: GoldenEvent | null;
  catchNullFracture: () => void;
```

- [ ] **Step 3: Add `catchNullFracture` callback**

After the `catchGolden` callback, add:

```ts
  const catchNullFracture = useCallback(() => {
    if (!nullFractureEvent) return;
    const bonus = Math.random() < 0.6;
    dispatch({ type: 'CATCH_NULL_FRACTURE', bonus });
    if (bonus) {
      dispatch({ type: 'ADD_SIGNAL', entry: { text: 'NULL FRACTURE: Void energy discharged. 15× DPS for 30s.', color: 'amber' } });
      addToast('[ NULL FRACTURE — WINDFALL ×15 ]', 'amber');
    } else {
      dispatch({ type: 'ADD_SIGNAL', entry: { text: 'NULL FRACTURE: Reality breached. −50% DPS for 15s.', color: 'crimson' } });
      addToast('[ NULL FRACTURE — VOID DRAIN ACTIVE ]', 'crimson');
    }
    setNullFractureEvent(null);
    playGolden();
  }, [nullFractureEvent, addToast]);
```

- [ ] **Step 4: Update `catchGolden` to also dispatch APPLY_BUFF for display**

`catchGolden` currently sets `activeGoldenEffect` (local React state) for the actual multiplier. We also dispatch `APPLY_BUFF` for the display-only buff chip. The display buff has **no `dpsMultiplier`** — the actual multiplier stays in `activeGoldenEffect`.

After each `setActiveGoldenEffect(...)` call, add the matching `dispatch({ type: 'APPLY_BUFF', buff: ... })`. Replace the entire `catchGolden` callback with:

```ts
  const catchGolden = useCallback(() => {
    if (!goldenEvent) return;
    const effectIdx = Math.floor(Math.random() * GOLDEN_EFFECTS.length);
    const effect = GOLDEN_EFFECTS[effectIdx];
    const dps = stateRef.current.doePerSecond;
    let bonus = 0;
    const now = Date.now();

    if (effect === 'void-flush') {
      setActiveGoldenEffect({ type: 'void-flush', endTime: now + 7000, multiplier: 13 });
      dispatch({ type: 'APPLY_BUFF', buff: { id: Math.random().toString(36).slice(2), label: 'VOID FLUSH ×13', type: 'void-flush', expiresAt: now + 7000 } });
      addToast('VOID FLUSH — 13x for 7s', 'amber');
      bonus = dps * 7 * 13;
    } else if (effect === 'resonant-frenzy') {
      setActiveGoldenEffect({ type: 'resonant-frenzy', endTime: now + 77000, multiplier: 7 });
      dispatch({ type: 'APPLY_BUFF', buff: { id: Math.random().toString(36).slice(2), label: 'RESONANT FRENZY ×7', type: 'frenzy', expiresAt: now + 77000 } });
      addToast('RESONANT FRENZY — 7x DPS for 77s', 'amber');
    } else if (effect === 'null-windfall') {
      bonus = dps * 60 * 15;
      addToast('NULL WINDFALL — 15 minutes of DPS granted', 'amber');
    } else if (effect === 'the-stare') {
      dispatch({ type: 'APPLY_STARE' });
      addToast('THE STARE — permanent +5% DPS', 'white');
    } else if (effect === 'erasure') {
      addToast('ERASURE — it took something.', 'crimson');
    }

    dispatch({ type: 'CATCH_GOLDEN', effect, bonus });
    dispatch({ type: 'ADD_SIGNAL', entry: { text: GOLDEN_LORE[effect], color: effect === 'erasure' ? 'crimson' : 'amber' } });
    setGoldenEvent(null);
    playGolden();
  }, [goldenEvent, addToast]);
```

- [ ] **Step 5: Replace the golden doe spawn effect to also spawn null fractures**

Find the entire `// Golden Doe events` `useEffect` block and replace it with:

```ts
  // Golden Doe / Null Fracture events
  useEffect(() => {
    function scheduleShimmer() {
      const delay = 300000 + Math.random() * 600000; // 5–15 min
      return setTimeout(() => {
        if (!goldenEvent && !nullFractureEvent) {
          const x = 10 + Math.random() * 70;
          const y = 10 + Math.random() * 70;
          const id = Math.random().toString(36).slice(2);
          const spawnFracture = stateRef.current.totalDoeEver >= 1e7 && Math.random() < 0.25;

          if (spawnFracture) {
            setNullFractureEvent({ id, x, y, startTime: Date.now() });
            playGolden();
            const dismissTimer = setTimeout(() => {
              setNullFractureEvent(prev => {
                if (prev) dispatch({ type: 'MISS_GOLDEN' });
                return null;
              });
            }, 12000);
            return () => clearTimeout(dismissTimer);
          } else {
            setGoldenEvent({ id, x, y, startTime: Date.now() });
            playGolden();
            const dismissTimer = setTimeout(() => {
              setGoldenEvent(prev => {
                if (prev) dispatch({ type: 'MISS_GOLDEN' });
                return null;
              });
            }, 8000);
            return () => clearTimeout(dismissTimer);
          }
        }
        scheduleShimmer();
      }, delay);
    }
    const t = scheduleShimmer();
    return () => clearTimeout(t);
  }, [goldenEvent, nullFractureEvent]);
```

- [ ] **Step 6: Add void leech spawn timer**

After the null surge `useEffect`, add:

```ts
  // Void Leech spawn timer — runs once on mount; reads current state via stateRef
  useEffect(() => {
    function findFreeAngle(existingAngles: number[]): number {
      for (let i = 0; i < 20; i++) {
        const candidate = Math.random() * 360;
        const tooClose = existingAngles.some(a => {
          const diff = Math.abs(candidate - a);
          return Math.min(diff, 360 - diff) < 30;
        });
        if (!tooClose) return candidate;
      }
      return Math.random() * 360;
    }

    function scheduleLeech() {
      const delay = 180000 + Math.random() * 120000; // 3–5 min
      return setTimeout(() => {
        const s = stateRef.current;
        if (s.leeches.length < 6 && s.totalDoeEver >= 1e4) {
          const angle = findFreeAngle(s.leeches.map((l: VoidLeech) => l.angle));
          const leech: VoidLeech = {
            id: Math.random().toString(36).slice(2),
            angle,
            attachedAt: Date.now(),
            absorbed: 0,
          };
          dispatch({ type: 'SPAWN_LEECH', leech });
          dispatch({ type: 'ADD_SIGNAL', entry: { text: 'VOID LEECH DETECTED — PURGE RECOMMENDED', color: 'amber' } });
          addToast('[ VOID LEECH ATTACHED ]', 'amber');
        }
        scheduleLeech();
      }, delay);
    }
    const t = scheduleLeech();
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 7: Expose new context values in the Provider return**

In the `GameContext.Provider value` object, add:

```ts
      nullFractureEvent, catchNullFracture,
```

- [ ] **Step 8: Update autosave to include new fields**

The autosave already spreads `stateRef.current` which now includes `activeBuffs` and `leeches` as plain arrays — they will serialize automatically. No change needed.

- [ ] **Step 9: Verify build**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors (all new action types are now handled).

- [ ] **Step 10: Commit**

```bash
git add src/store/GameContext.tsx
git commit -m "feat: add null fracture spawn, leech timer, golden buff display dispatch"
```

---

## Task 4: Create SignalTicker.tsx

**Files:**
- Create: `src/components/SignalTicker.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useMemo } from 'react';
import { useGame } from '../store/GameContext';
import { formatDoe, formatDps } from '../utils/formatting';

const TICKER_LORE = [
  'THE DOE DOES NOT SLEEP',
  'VOID SATURATION NOMINAL',
  'CONDUIT HARMONICS DETECTED',
  'SIGNAL COHERENCE DEGRADING',
  'SOMETHING IS LISTENING',
  'NULL APERTURES HUMMING',
  'FRACTURED ECHO PATTERNS DETECTED',
  'THE DOE RECOGNIZES YOUR PRESENCE',
  'RESONANCE LEVELS WITHIN ACCEPTABLE PARAMETERS',
  'DO NOT LOOK DIRECTLY AT THE DOE',
  'VOID ACCUMULATION PROCEEDING AS EXPECTED',
  'THE BOUNDARY IS ADMINISTRATIVE',
  'NULL FRACTURES MAY APPEAR AT ANY TIME',
  'YOUR CONTACT WITH THE DOE IS NOTED',
  'WHAT WAS ONCE SIGNAL IS NOW BACKGROUND',
  'THE GLYPHS ARE SELF-CORRECTING',
  'MARGIN LISTENERS HAVE SOMETHING TO SAY',
  'ALL CONDUITS REPORT NOMINAL FUNCTION',
  'THE SIGNAL IS GETTING STRONGER',
  'SOMETHING HAS BEEN HERE BEFORE YOU',
];

export default function SignalTicker() {
  const { state } = useGame();

  const tickerText = useMemo(() => {
    const sep = '  ◈  ';
    const recentSignals = state.signalLog
      .slice(-5)
      .map(e => e.text.replace(/[\[\]]/g, '').trim());
    const stats = [
      `${formatDoe(state.totalDoeEver)} DOE ACCUMULATED`,
      `${formatDps(state.doePerSecond)}/s`,
      state.leeches.length > 0 ? `${state.leeches.length} LEECH${state.leeches.length > 1 ? 'ES' : ''} ATTACHED` : null,
    ].filter(Boolean) as string[];
    const all = [...recentSignals, ...stats, ...TICKER_LORE];
    return all.join(sep) + sep;
  }, [state.signalLog, state.totalDoeEver, state.doePerSecond, state.leeches.length]);

  return (
    <div
      style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        borderTop: '1px solid rgba(0,255,65,0.12)',
        borderBottom: '1px solid rgba(0,255,65,0.12)',
        background: 'rgba(0,255,65,0.02)',
        padding: '3px 0',
        flexShrink: 0,
      }}
    >
      <span
        className="vt323"
        style={{
          display: 'inline-block',
          fontSize: 13,
          color: 'rgba(184,255,208,0.5)',
          letterSpacing: '0.05em',
          animation: 'ticker-scroll 90s linear infinite',
          paddingLeft: '100%',
        }}
      >
        {tickerText}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Add `ticker-scroll` keyframe to `src/index.css`**

Find a good place in `src/index.css` (e.g. near the other `@keyframes`) and add:

```css
@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-100%); }
}
```

- [ ] **Step 3: Verify it renders (wire in next task, but confirm no TS errors)**

```bash
npm run build 2>&1 | grep -i error | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SignalTicker.tsx src/index.css
git commit -m "feat: add SignalTicker scrolling marquee component"
```

---

## Task 5: Create BuffsBar.tsx

**Files:**
- Create: `src/components/BuffsBar.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState, useEffect } from 'react';
import { useGame } from '../store/GameContext';
import type { ActiveBuff } from '../types';

const BUFF_COLORS: Record<ActiveBuff['type'], string> = {
  frenzy:       'var(--amber)',
  windfall:     'var(--amber-bright)',
  'void-flush': 'var(--phosphor)',
  'click-surge':'var(--cyan)',
  'null-drain': 'var(--crimson)',
};

function BuffChip({ buff }: { buff: ActiveBuff }) {
  const [durationSec] = useState(() => Math.max(0.1, (buff.expiresAt - Date.now()) / 1000));
  const color = BUFF_COLORS[buff.type] ?? 'var(--pale-void)';

  return (
    <div
      style={{
        position: 'relative',
        border: `1px solid ${color}`,
        padding: '3px 10px 5px',
        color,
        overflow: 'hidden',
        opacity: 0.92,
        flexShrink: 0,
      }}
    >
      <span className="vt323" style={{ fontSize: 15, letterSpacing: '0.05em' }}>
        {buff.label}
      </span>
      {/* Draining countdown bar along the bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          background: color,
          opacity: 0.6,
          width: '100%',
          transformOrigin: 'left center',
          animation: `drain-bar ${durationSec}s linear forwards`,
        }}
      />
    </div>
  );
}

export default function BuffsBar() {
  const { state } = useGame();
  const [, forceRender] = useState(0);

  // Re-render every second so expired buffs disappear without waiting for TICK
  useEffect(() => {
    const id = setInterval(() => forceRender(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const visible = state.activeBuffs.filter(b => b.expiresAt > now);
  if (visible.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        padding: '3px 8px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(0,255,65,0.1)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      <span className="vt323" style={{ fontSize: 12, color: 'rgba(0,255,65,0.4)', letterSpacing: '2px', marginRight: 4 }}>
        ACTIVE
      </span>
      {visible.map(buff => (
        <BuffChip key={buff.id} buff={buff} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add `drain-bar` keyframe to `src/index.css`**

```css
@keyframes drain-bar {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -10
```

- [ ] **Step 4: Commit**

```bash
git add src/components/BuffsBar.tsx src/index.css
git commit -m "feat: add BuffsBar active-effects display with CSS countdown"
```

---

## Task 6: Create ResonanceBar.tsx

**Files:**
- Create: `src/components/ResonanceBar.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useGame } from '../store/GameContext';

const TIERS = [
  { label: 'INERT',          color: '#444444' },
  { label: 'FAINT SIGNAL',   color: '#6428ff' },
  { label: 'RESONANT',       color: '#9040ff' },
  { label: 'FRACTURED ECHO', color: '#b464ff' },
  { label: 'DEEP CONTACT',   color: '#ff3cb4' },
  { label: 'CONVERGENCE',    color: '#ff5050' },
  { label: 'VOID CHORUS',    color: '#ffc200' },
  { label: 'MAXIMUM',        color: '#ffffff' },
];

export default function ResonanceBar() {
  const { state } = useGame();
  const achievementCount = state.achievements.size;
  const tier = Math.min(7, Math.floor(achievementCount / 5));
  const { label, color } = TIERS[tier];
  const fillPct = tier < 7 ? ((achievementCount % 5) / 5) * 100 : 100;
  const dpsBonus = tier * 2;
  const isMax = tier === 7;

  return (
    <div style={{ width: '100%', paddingBottom: 4 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          letterSpacing: '1px',
          color: color,
          opacity: 0.8,
          marginBottom: 3,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>VOID RESONANCE — {label}{dpsBonus > 0 ? `  [+${dpsBonus}% DPS]` : ''}</span>
        <span style={{ opacity: 0.6 }}>{achievementCount} ACH</span>
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${fillPct}%`,
            background: color,
            boxShadow: `0 0 8px ${color}88`,
            transition: 'width 0.4s ease',
            animation: isMax ? 'resonance-pulse 2s ease-in-out infinite' : undefined,
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `resonance-pulse` keyframe to `src/index.css`**

```css
@keyframes resonance-pulse {
  0%, 100% { opacity: 0.85; }
  50%       { opacity: 1; }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -10
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ResonanceBar.tsx src/index.css
git commit -m "feat: add ResonanceBar achievement-tier DPS display"
```

---

## Task 7: Create VoidLeechLayer.tsx

**Files:**
- Create: `src/components/VoidLeechLayer.tsx`

- [ ] **Step 1: Create the component**

The DoeClickable SVG is 280×280. Doe center is at (140, 140). Leeches sit at radius 125px from center.

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../store/GameContext';
import { formatDoe } from '../utils/formatting';

const LEECH_RADIUS = 125;  // px from SVG center (280×280 container)
const LEECH_SIZE = 18;     // px diameter

export default function VoidLeechLayer() {
  const { state, dispatch, addToast } = useGame();

  if (state.leeches.length === 0) return null;

  const popLeech = (leechId: string, absorbed: number, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'POP_LEECH', leechId });
    addToast(`[ LEECH PURGED +${formatDoe(absorbed * 1.1)} DOE ]`, 'pale');
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: 280, height: 280,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {state.leeches.map(leech => {
          const rad = (leech.angle * Math.PI) / 180;
          const cx = 140 + LEECH_RADIUS * Math.cos(rad) - LEECH_SIZE / 2;
          const cy = 140 + LEECH_RADIUS * Math.sin(rad) - LEECH_SIZE / 2;

          return (
            <motion.div
              key={leech.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => popLeech(leech.id, leech.absorbed, e)}
              title={`VOID LEECH — Pop to claim ${formatDoe(leech.absorbed * 1.1)} doe`}
              style={{
                position: 'absolute',
                left: cx,
                top: cy,
                width: LEECH_SIZE,
                height: LEECH_SIZE,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(150,30,220,0.95), rgba(60,0,100,0.8))',
                border: '1px solid rgba(180,100,255,0.7)',
                boxShadow: '0 0 10px rgba(140,0,200,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: 'rgba(220,180,255,0.9)',
                cursor: 'pointer',
                pointerEvents: 'all',
                animation: 'leech-pulse 2s ease-in-out infinite',
                userSelect: 'none',
              }}
            >
              ▲
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Count badge */}
      {state.leeches.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 4, right: 4,
          fontSize: 9,
          color: 'rgba(180,100,255,0.7)',
          letterSpacing: '1px',
          fontFamily: 'var(--font-mono)',
          pointerEvents: 'none',
        }}>
          {state.leeches.length} LEECH{state.leeches.length > 1 ? 'ES' : ''}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add `leech-pulse` keyframe to `src/index.css`**

```css
@keyframes leech-pulse {
  0%, 100% { transform: scale(1);    box-shadow: 0 0 10px rgba(140,0,200,0.5); }
  50%       { transform: scale(1.18); box-shadow: 0 0 16px rgba(180,0,255,0.7); }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -10
```

- [ ] **Step 4: Commit**

```bash
git add src/components/VoidLeechLayer.tsx src/index.css
git commit -m "feat: add VoidLeechLayer parasite mechanic"
```

---

## Task 8: Create NullFractureEvent.tsx

**Files:**
- Create: `src/components/NullFractureEvent.tsx`

- [ ] **Step 1: Create the component**

This mirrors `GoldenDoeEvent.tsx` but with crimson styling and a 12s timer.

```tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../store/GameContext';

const DESPAWN_SECS = 12;

export default function NullFractureEvent() {
  const { nullFractureEvent, catchNullFracture } = useGame();
  const [timeLeft, setTimeLeft] = useState(DESPAWN_SECS);

  useEffect(() => {
    if (!nullFractureEvent) { setTimeLeft(DESPAWN_SECS); return; }
    setTimeLeft(DESPAWN_SECS);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) { clearInterval(interval); return 0; }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [nullFractureEvent?.id]);

  return (
    <AnimatePresence>
      {nullFractureEvent && (
        <motion.div
          key={nullFractureEvent.id}
          className="fixed z-40 cursor-pointer"
          style={{ left: `${nullFractureEvent.x}%`, top: `${nullFractureEvent.y}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 0.85 }}
          exit={{ opacity: 0, scale: 0 }}
          onClick={catchNullFracture}
          title="NULL FRACTURE — RISK: 40% VOID DRAIN"
        >
          <div style={{ position: 'relative', width: 60, height: 60 }}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <ellipse cx="30" cy="30" rx="25" ry="25"
                fill="none" stroke="rgba(200,0,50,0.6)" strokeWidth="1"
                style={{ animation: 'pulse-aura 1.2s ease-in-out infinite' }} />
              <ellipse cx="30" cy="30" rx="18" ry="18"
                fill="rgba(180,0,40,0.08)" stroke="rgba(200,0,50,0.4)" strokeWidth="1" />
              <ellipse cx="30" cy="30" rx="8" ry="8"
                fill="rgba(180,0,40,0.15)" />
              <text x="30" y="34" textAnchor="middle" fontSize="12"
                fill="rgba(220,0,60,0.9)" fontFamily="Share Tech Mono">✦</text>
            </svg>
            {/* Timer ring */}
            <svg
              width="60" height="60" viewBox="0 0 60 60"
              style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
            >
              <circle
                cx="30" cy="30" r="28"
                fill="none"
                stroke="rgba(220,0,60,0.7)"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - timeLeft / DESPAWN_SECS)}`}
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -10
```

- [ ] **Step 3: Commit**

```bash
git add src/components/NullFractureEvent.tsx
git commit -m "feat: add NullFractureEvent crimson risk/reward shimmer"
```

---

## Task 9: Update ConduitsPanel.tsx — Rich Tooltips

**Files:**
- Modify: `src/components/ConduitsPanel.tsx`

- [ ] **Step 1: Add tooltip state and imports**

At the top of the file, add the UPGRADES import:

```ts
import { UPGRADES } from '../data/upgrades';
```

Inside the `ConduitsPanel` component function, add state after existing state:

```ts
  const [tooltip, setTooltip] = useState<{ id: string; rect: DOMRect } | null>(null);
```

- [ ] **Step 2: Add tooltip render helper**

Before the `return` statement of `ConduitsPanel`, add this helper (inline, not exported):

```tsx
  const renderTooltip = () => {
    if (!tooltip) return null;
    const c = CONDUITS.find(x => x.id === tooltip.id);
    if (!c) return null;
    const owned = state.conduits[c.id] || 0;
    if (owned === 0) return null;

    const conduitDps = c.baseDps * owned;
    const pct = totalDps > 0 ? ((conduitDps / totalDps) * 100).toFixed(1) : '0.0';
    const effBlocks = Math.min(5, Math.ceil((conduitDps / Math.max(totalDps, 1)) * 25));
    const effStr = '█'.repeat(effBlocks) + '░'.repeat(5 - effBlocks);

    // Find next upgrade that requires this conduit
    const nextUp = UPGRADES.find(u =>
      u.requires?.conduit === c.id &&
      !state.upgrades.has(u.id) &&
      (state.conduits[c.id] || 0) < u.requires.count
    );

    const top = Math.min(tooltip.rect.top, window.innerHeight - 180);

    return (
      <div
        style={{
          position: 'fixed',
          top,
          right: window.innerWidth - tooltip.rect.left + 6,
          width: 220,
          background: 'rgba(4,8,14,0.97)',
          border: '1px solid rgba(0,255,65,0.3)',
          padding: '10px 12px',
          zIndex: 60,
          pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(0,255,65,0.08)',
        }}
      >
        <div className="vt323" style={{ fontSize: 17, color: 'var(--amber)', marginBottom: 6 }}>
          {c.name.toUpperCase()} ×{owned}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(0,255,65,0.65)', marginBottom: 2 }}>
          ▸ {c.baseDps}/s × {owned} = {(conduitDps).toFixed(2)}/s
        </div>
        <div style={{ fontSize: 10, color: 'rgba(0,200,255,0.65)', marginBottom: 2 }}>
          ▸ {pct}% of total output
        </div>
        <div style={{ fontSize: 10, color: 'rgba(180,100,255,0.65)', marginBottom: 6 }}>
          ▸ Efficiency: <span style={{ letterSpacing: 2 }}>{effStr}</span>
        </div>
        {nextUp && (
          <div style={{ fontSize: 10, color: 'rgba(255,194,0,0.6)', marginBottom: 6 }}>
            ▸ Upgrade unlocks at {nextUp.requires!.count} owned
          </div>
        )}
        <div style={{ fontSize: 9, color: 'rgba(184,255,208,0.35)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {c.description}
        </div>
      </div>
    );
  };
```

- [ ] **Step 3: Wire `onMouseEnter`/`onMouseLeave` to the conduit row div**

Find the conduit row `<div key={c.id}>` wrapper and add handlers to the inner clickable div (the one with `className="conduit-row ..."`):

```tsx
              onMouseEnter={(e) => setTooltip({ id: c.id, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() })}
              onMouseLeave={() => setTooltip(null)}
```

- [ ] **Step 4: Render tooltip at end of component return**

Before the final closing `</div>` of the component return, add:

```tsx
      {renderTooltip()}
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -10
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ConduitsPanel.tsx
git commit -m "feat: add rich hover tooltips to conduit rows"
```

---

## Task 10: Update App.tsx — Wire All Components

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/App.tsx`, add the new component imports after the existing ones:

```ts
import SignalTicker from './components/SignalTicker';
import BuffsBar from './components/BuffsBar';
import ResonanceBar from './components/ResonanceBar';
import VoidLeechLayer from './components/VoidLeechLayer';
import NullFractureEvent from './components/NullFractureEvent';
```

- [ ] **Step 2: Add SignalTicker and BuffsBar between HUD and columns**

In `GameUI`, find `{/* 3-column layout */}` and insert the new strips between `<HUD />` and the 3-column flex div:

```tsx
      <HUD />
      <SignalTicker />
      <BuffsBar />

      {/* 3-column layout */}
      <div className="flex flex-1 gap-2 p-2" style={{ minHeight: 0, overflow: 'hidden' }}>
```

- [ ] **Step 3: Add ResonanceBar inside the left panel**

Find the sub-stats section (the flex div with per-second/per-click) and insert `<ResonanceBar />` immediately after it, before `<DoeClickable />`:

```tsx
            {/* Divider */}
            <div style={{ width: '100%', height: 1, background: 'linear-gradient(...)' }} />

            {/* Sub-stats */}
            <div className="flex gap-0 w-full">
              {/* ... per-sec/per-click unchanged ... */}
            </div>

            <ResonanceBar />   {/* ← add here */}

            {/* The Doe SVG */}
            <DoeClickable />
```

- [ ] **Step 4: Wrap DoeClickable with a relative container and overlay VoidLeechLayer**

Replace the bare `<DoeClickable />` line with:

```tsx
            {/* The Doe SVG + leeches */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <DoeClickable />
              <VoidLeechLayer />
            </div>
```

- [ ] **Step 5: Add NullFractureEvent alongside GoldenDoeEvent**

Find `<GoldenDoeEvent />` near the bottom of `GameUI` and add:

```tsx
      <GoldenDoeEvent />
      <NullFractureEvent />
```

- [ ] **Step 6: Verify full build**

```bash
npm run build 2>&1 | tail -30
```

Expected: exit 0, no TypeScript errors.

- [ ] **Step 7: Run dev server and manually verify all 6 features**

```bash
npm run dev
```

Open http://localhost:5173 and verify:

1. **Signal Ticker** — scrolling text appears between HUD and main layout. Updates when golden doe fires.
2. **Buffs Bar** — catch a golden doe → chip appears with draining countdown bar. Disappears when expired.
3. **Resonance Bar** — visible below per-sec/per-click stats. Tier label and color match achievement count.
4. **Conduit Tooltips** — hover any owned conduit → tooltip appears to the left with DPS%, efficiency blocks, lore.
5. **Void Leeches** — to test quickly, in browser console: `Game` is not exposed but you can trigger a save-load with fabricated data, or simply wait. Alternatively open console and run: `window.__spawnLeech = () => document.dispatchEvent(new CustomEvent('test'))` — or just wait 3+ min in real gameplay.
6. **Null Fracture** — after reaching `1e7` total doe, ~25% of golden doe spawns become crimson shimmers.

- [ ] **Step 8: Final commit**

```bash
git add src/App.tsx
git commit -m "feat: wire SignalTicker, BuffsBar, ResonanceBar, VoidLeechLayer, NullFractureEvent into layout"
```

---

## Quick-Test Cheat Sheet

To test leeches without waiting 3 minutes, open browser DevTools console after the game loads and run:

```js
// Inject a leech directly into localStorage save and reload
const save = JSON.parse(localStorage.getItem('doe-clicker-save') || '{}');
save.leeches = [{ id: 'test1', angle: 45, attachedAt: Date.now(), absorbed: 500 }];
save.totalDoeEver = 1e5;
localStorage.setItem('doe-clicker-save', JSON.stringify(save));
location.reload();
```

To test null fracture outcomes without waiting for spawn:

```js
// Same pattern — inject a save then reload
// The fracture spawns via GameContext timer; to force it, set totalDoeEver >= 1e7 in save
const save = JSON.parse(localStorage.getItem('doe-clicker-save') || '{}');
save.totalDoeEver = 2e7;
localStorage.setItem('doe-clicker-save', JSON.stringify(save));
location.reload();
// Then wait a few minutes for the shimmer timer to fire (or reduce delay temporarily)
```
