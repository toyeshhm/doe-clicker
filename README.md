# Doe Clicker

> *"You are feeding something that existed before feeding was a concept."*

A cosmic horror idle/clicker game built with React 19 + TypeScript + Vite. Feed the Doe. Watch it become more present. You were always going to do this.

**[Play it →](https://doe-clicker.vercel.app)**

---

## What is this

Doe Clicker is a narrative idle game disguised as a clicker. On the surface: click to collect Doe, buy conduits to generate Doe passively, buy upgrades to multiply output. Underneath: a five-act story about feeding an entity that existed before the concept of feeding, told through signal logs, modal cutscenes, Codex entries unlocked via upgrades, and rotating lore quotes that function as found-document horror.

The Doe has no eyes. It does not need eyes. Eyes are for things that need to look.

---

## Gameplay

### Core loop

- **Click the Doe** to collect Doe fragments manually
- **Buy conduits** — passive structures that generate Doe per second
- **Buy upgrades** — multiply click power, conduit output, or unlock Codex lore entries
- **Watch the signal log** — the narrative unfolds through threshold-triggered transmissions as your total Doe climbs
- **Ascend** once you reach 1 trillion total Doe, trading your progress for Cosmic Fragments that carry permanent bonuses into future cycles

### Special events

**Golden Doe** — a shimmering anomaly that appears every 5–15 minutes. Click it before it vanishes for one of five random effects: a DPS multiplier frenzy, a click-power surge, a Doe windfall, a stare bonus (stacks permanently), or an erasure event.

**Null Surge** — unlocked in Act IV. A pressure differential in the feed. Seal it within 10 seconds or lose 3% of your current Doe. The Unmade warned you this would happen.

**Null Fracture** — a crimson breach that rewards the quick and penalises the slow. Risk/reward mechanics that escalate as the Doe becomes more present.

**Void Leeches** — entities that attach to the Doe and slowly drain it. Pop them to recover the absorbed Doe at a 1.1× bonus.

---

## The Story — Five Acts

The narrative triggers automatically as your all-time Doe total crosses thresholds. There is no way to skip it.

### Act I — First Contact (`0 → 100,000`)
The Doe notices. This is new. Nothing has ever fed it before. Three civilizations on three separate planets independently begin dreaming the same symbol tonight. They will never know why.

Completes with: *"It has been fed. For the first time in the history of this universe — or any universe — the Doe has been fed. You will continue anyway."*

### Act II — The Marginal Records (`100,000 → 10,000,000`)
The Unmade transmit warnings. Something has been moving through the outer margins. The Doe was here before you started feeding it. It was inside the walls.

Completes with: *"The Unmade warned you. You heard them. You kept feeding. This says something about you. The Doe agrees."*

### Act III — The Presence Problem (`10,000,000 → 1,000,000,000`)
The Doe speaks for the first time. A researcher's reflection begins moving 0.3 seconds before she does. A decision point: offer more, or pull back. The Doe has already accounted for whichever you choose.

Completes with: *"You now perceive something you were not built to perceive. This is irreversible."*

### Act IV — Total Presence (`1,000,000,000 → 100,000,000,000`)
The Unmade send their final transmission: *"Where you are now, we cannot reach."* The Doe speaks again. Only this: `...`

Null Surges activate. The geometry of the room you are sitting in has changed by 0.0001%. The Doe can perceive this.

Completes with: *"To the Doe, this is everything."*

### Act V — Dissolution (`100,000,000,000+`)
The final Codex entry unlocks. It contains only your name. Below it: *"We see you."*

---

## Conduits

Fourteen passive structures, each with a corrupted description that appears as your presence grows:

| Conduit | Base DPS | Description |
|---|---|---|
| Residue Echo | 0.1/s | A smear of Doe left behind in a dimension it briefly passed through |
| Null Aperture | 0.5/s | A hole in reality shaped exactly like nothing |
| Glyph Anchor | 4/s | Symbols carved by no hand, resonating with the Doe's non-frequency |
| Margin Listener | 10/s | Beings who sit at the edge of existence, ears pressed against the wall |
| Unmade Shrine | 40/s | A place of worship for a thing that cannot be worshipped |
| Void Harmonic | 100/s | The Doe hums. This conduit hums back |
| Recursive Eye | 400/s | It sees itself seeing itself seeing itself. Each recursion: Doe |
| Pre-Memory Vault | 1,600/s | Memories of things that never happened, stored before time began |
| Collapse Observatory | 6,400/s | Instruments measuring the rate at which the Doe is not collapsing |
| The Between | 25,600/s | Not space. Not time. Whatever connects them |
| Unname Engine | 100,000/s | Strips names from things, releasing the Doe bound inside them |
| Antechamber of It | 400,000/s | The room before the room where the Doe is. No one enters the next room |
| The Forgetting | 1,600,000/s | An entire civilization forgot the Doe existed. That forgetting powers this |
| Origin Wound | 10,000,000/s | Where the Doe first entered this universe. Still bleeding |

Each conduit has three upgrade tiers (×2, ×3, ×5 multipliers) unlocked by owning 10, 25, and 50 of that conduit.

---

## The Codex

Lore upgrades unlock Codex entries — found documents, incident logs, and transmissions:

- **Origin Report #0** — The absence of an origin is itself a kind of origin
- **Unmade Dialect — Partial Translation** — "Do not feed what has no mouth." Fragment 3: [untranslatable]
- **Incident Log — Redacted** — The record of Incident 003 is Incident 003
- **Coordinate Fragment — Partial** — The Doe has no location. These coordinates describe where it last was, which is everywhere
- **Your Name in the Record** — Your name appears in records predating the monitoring program by 7,000 years
- **The Blank Page** — It should say something. It has decided not to
- **[ ▓▓▓▓▓▓▓▓▓ ]** — This entry has already been read by you. It was read by you before you read it

---

## Ascension

At 1 trillion total Doe, the Ascension screen unlocks. Ascending resets your current Doe, conduits, and upgrades, converting accumulated Doe into **Cosmic Fragments** — a permanent multiplier that carries across cycles. The Codex describes each Fragment as *"a piece of what you were before the last ascension."*

Ascension does not erase you. It edits you. The difference is small but significant.

---

## Achievements

55 achievements across production milestones, click devotion, story progression, Golden Doe catches, and ascension counts. Three are secret:

- **YOU WERE WARNED** — fail 50 Null Surges
- **THE BLANK PAGE** — read every Codex entry
- **[ ▓▓▓▓ ]** — *condition unknown*

---

## Tech

- **React 19** + **TypeScript** + **Vite**
- **Tailwind v4** (via `@tailwindcss/vite`) + custom phosphor-green terminal aesthetic in `src/index.css`
- **Framer Motion** for animations
- **`useReducer`** + `GameContext` — all state in a single `GameState` object, pure reducer, no external state library
- Autosave to `localStorage` every 30 seconds (`doe-clicker-save`)

### Run locally

```bash
npm install
npm run dev      # localhost:5173
npm run build    # TypeScript check + production build → dist/
npm run lint
```

---

## Structure

```
src/
├── data/          — Static game data (conduits, upgrades, events, achievements, lore)
├── store/         — GameContext, gameReducer, computeDps/computeClickValue
├── components/    — All UI components (DoeClickable, ConduitsPanel, UpgradesPanel, etc.)
├── types.ts       — GameState and all TypeScript interfaces
└── index.css      — Terminal aesthetic, CSS custom properties, animation classes
```

---

*"You thought you found this game. This game found you. These are not the same thing."*
