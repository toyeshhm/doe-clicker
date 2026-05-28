# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR on localhost:5173)
npm run build      # TypeScript check + Vite production build → dist/
npm run lint       # ESLint
npm run preview    # Serve the production build locally
```

No test suite is configured. Verify features by running the dev server.

## Architecture

Doe Clicker is a browser idle/clicker game built with React 19 + TypeScript + Vite. Styling is Tailwind v4 (via `@tailwindcss/vite`) plus a heavy custom CSS layer in `src/index.css` that defines the phosphor-green terminal aesthetic. Framer Motion is the only animation library.

### State model

All mutable game state lives in a single `GameState` object (`src/types.ts`). The state is managed by `useReducer` in `src/store/GameContext.tsx` with a pure reducer in `src/store/gameReducer.ts`.

- **`gameReducer`** handles all state transitions (clicks, ticks, purchases, events, ascension, reset, save/load).
- **`computeDps`** and **`computeClickValue`** (also in `gameReducer.ts`) are the core economic formulas — called every tick and on every purchase. When changing upgrade effects or conduit scaling, update these functions.
- **`GameProvider`** owns all timers: the 50 ms game tick (`TICK` dispatch), 30 s autosave, Golden Doe spawning (5–15 min random), Null Surge spawning (Act IV, ~60–90 s), story event checking, achievement checking, and lore quote rotation.
- `GameState` uses `Set<string>` for `upgrades`, `achievements`, `unlockedCodex`, and `seenEvents`. These are serialised to arrays in localStorage and rehydrated on load.

### Data layer (`src/data/`)

Static game data — no runtime mutation:

| File | Exports | Purpose |
|------|---------|---------|
| `conduits.ts` | `CONDUITS`, `CONDUIT_MAP` | 14 passive income buildings with base cost and DPS |
| `upgrades.ts` | `UPGRADES`, `UPGRADE_MAP` | Purchasable upgrades keyed by short id (e.g. `re-t1`) |
| `storyEvents.ts` | `STORY_EVENTS` | Threshold-triggered narrative events (signal, modal, choice, doe-speaks) |
| `achievements.ts` | `ACHIEVEMENTS` | Achievement definitions with `check(state)` predicates |
| `loreQuotes.ts` | `LORE_QUOTES` | Rotating flavour text shown under the doe |

### Component map

```
App.tsx
├── IntroScreen          — first-visit cinematic (localStorage flag: doe-intro-seen)
└── GameProvider
    └── GameUI (3-column fixed layout)
        ├── HUD              — top bar (fragment count, ascension button, reset)
        ├── LEFT: DoeClickable + stats display
        ├── MIDDLE: tab panel
        │   ├── UpgradesPanel
        │   ├── Codex        — lore entries unlocked via upgrades/events
        │   └── StatsPanel
        ├── RIGHT: ConduitsPanel
        ├── SignalLog        — scrolling event feed at bottom of middle column
        ├── MilestoneModal   — act-complete story modals
        ├── GoldenDoeEvent   — timed random click event
        ├── NullSurgeEvent   — Act IV hazard (seal within 10 s or lose 3% doe)
        ├── AscensionScreen  — prestige reset UI (unlocks at 1e12 total doe)
        └── Toasts           — ephemeral corner notifications
```

### Upgrade id convention

Conduit upgrade ids follow the pattern `<shortcode>-<tier>` where shortcode maps to conduit id:

| Conduit id | Shortcode |
|------------|-----------|
| residue-echo | re |
| null-aperture | na |
| glyph-anchor | ga |
| margin-listener | ml |
| unmade-shrine | us |
| void-harmonic | vh |

### Persistence

Save key: `doe-clicker-save` in `localStorage`. Sets are serialised as arrays. Load happens once on mount inside `GameProvider`. Autosave fires every 30 s.

### Visual / CSS conventions

CSS custom properties (`--phosphor`, `--amber`, `--crimson`, etc.) defined in `:root` in `index.css` are used throughout inline styles and Tailwind arbitrary values. The `.panel`, `.btn-terminal`, `.vt323`, `.glitch-active`, and `.transcendence-mode` classes are all defined in `index.css`/`App.css` — prefer these over ad-hoc inline styles for consistent theming.

### Deployment

Deployed to Vercel. Project config is in `.vercel/project.json`.
