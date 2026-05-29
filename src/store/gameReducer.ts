import type { GameState, GameAction, SignalEntry, ActiveBuff } from '../types';
import { CONDUIT_MAP } from '../data/conduits';
import { UPGRADE_MAP } from '../data/upgrades';

export function computeDps(state: GameState): number {
  let dps = 0;
  for (const [id, count] of Object.entries(state.conduits)) {
    const c = CONDUIT_MAP[id];
    if (!c || count === 0) continue;
    let multiplier = 1;
    // Building upgrades
    const tiers = ['t1', 't2', 't3'];
    for (const tier of tiers) {
      // check shorthand ids
      const shortMap: Record<string, string> = {
        'residue-echo': 're', 'null-aperture': 'na', 'glyph-anchor': 'ga',
        'margin-listener': 'ml', 'unmade-shrine': 'us', 'void-harmonic': 'vh',
      };
      const prefix = shortMap[id];
      if (prefix) {
        const uid = `${prefix}-${tier}`;
        if (state.upgrades.has(uid)) {
          const up = UPGRADE_MAP[uid];
          if (up?.multiplier) multiplier *= up.multiplier;
        }
      }
    }
    // All-production upgrades
    let allMult = 1;
    for (const uid of state.upgrades) {
      const up = UPGRADE_MAP[uid];
      if (up?.type === 'all' && up.allMultiplier) allMult *= up.allMultiplier;
    }
    dps += c.baseDps * count * multiplier * allMult;
  }

  const permBonus = 1 + state.permanentDpsBonus;
  const stareBonus = 1 + state.stareStacks * 0.05;
  const fragBonus = 1 + state.cosmicFragments * 0.02;
  const resonanceTier = Math.min(7, Math.floor(state.achievements.size / 5));
  const resonanceBonus = 1 + resonanceTier * 0.02;
  return dps * permBonus * stareBonus * fragBonus * resonanceBonus;
}

export function computeClickValue(state: GameState): number {
  let mult = 1;
  let addPercent = 0;
  for (const uid of state.upgrades) {
    const up = UPGRADE_MAP[uid];
    if (up?.type === 'click') {
      if (up.multiplier) mult *= up.multiplier;
      if (up.addClickPercent) addPercent += up.addClickPercent;
    }
  }
  const base = 1 * mult;
  const fromDps = computeDps(state) * addPercent;
  const fragBonus = 1 + state.cosmicFragments * 0.02;
  return (base + fromDps) * (1 + state.permanentClickBonus) * fragBonus;
}

export const INITIAL_STATE: GameState = {
  doe: 0,
  totalDoeEver: 0,
  totalDoeAllTime: 0,
  doePerClick: 1,
  doePerSecond: 0,
  conduits: {},
  upgrades: new Set(),
  achievements: new Set(),
  unlockedCodex: new Set(),
  seenEvents: new Set(),
  signalLog: [],
  clickCount: 0,
  goldenCaught: 0,
  goldenMissed: 0,
  surgeSsealed: 0,
  surgeFailed: 0,
  cosmicFragments: 0,
  ascensionCount: 0,
  totalTimePlayed: 0,
  cycleTimePlayed: 0,
  actCompleted: 0,
  transcendenceMode: false,
  permanentDpsBonus: 0,
  permanentClickBonus: 0,
  stareStacks: 0,
  lastSaved: Date.now(),
  activeBuffs: [],
  leeches: [],
};

function addSignal(state: GameState, entry: Omit<SignalEntry, 'id' | 'timestamp'>): GameState {
  const newEntry: SignalEntry = {
    ...entry,
    id: Math.random().toString(36).slice(2),
    timestamp: Date.now(),
  };
  return {
    ...state,
    signalLog: [...state.signalLog.slice(-199), newEntry],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CLICK': {
      const earned = action.clickValue;
      return {
        ...state,
        doe: state.doe + earned,
        totalDoeEver: state.totalDoeEver + earned,
        totalDoeAllTime: state.totalDoeAllTime + earned,
        clickCount: state.clickCount + 1,
      };
    }

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

    case 'APPLY_BUFF': {
      // Replace existing buff of same type (no stacking, refresh duration)
      const filtered = state.activeBuffs.filter(b => b.type !== action.buff.type);
      return { ...state, activeBuffs: [...filtered, action.buff] };
    }

    case 'SPAWN_LEECH':
      return { ...state, leeches: [...state.leeches, action.leech] };

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

    case 'CATCH_NULL_FRACTURE': {
      const now = Date.now();
      const buff: ActiveBuff = action.bonus
        ? { id: Math.random().toString(36).slice(2), label: 'NULL WINDFALL ×15', type: 'windfall', dpsMultiplier: 15, expiresAt: now + 30_000 }
        : { id: Math.random().toString(36).slice(2), label: 'VOID DRAIN −50%', type: 'null-drain', dpsMultiplier: 0.5, expiresAt: now + 15_000 };
      const filtered = state.activeBuffs.filter(b => b.type !== buff.type);
      return { ...state, activeBuffs: [...filtered, buff], goldenCaught: state.goldenCaught + 1 };
    }

    case 'BUY_CONDUIT': {
      const { conduitId, quantity, cost } = action;
      if (state.doe < cost) return state;
      return {
        ...state,
        doe: state.doe - cost,
        conduits: {
          ...state.conduits,
          [conduitId]: (state.conduits[conduitId] || 0) + quantity,
        },
      };
    }

    case 'BUY_UPGRADE': {
      const up = UPGRADE_MAP[action.upgradeId];
      if (!up || state.upgrades.has(action.upgradeId) || state.doe < up.cost) return state;
      const newUpgrades = new Set(state.upgrades);
      newUpgrades.add(action.upgradeId);
      let newCodex = state.unlockedCodex;
      if (up.unlocksCodex) {
        newCodex = new Set(state.unlockedCodex);
        newCodex.add(up.unlocksCodex);
      }
      return {
        ...state,
        doe: state.doe - up.cost,
        upgrades: newUpgrades,
        unlockedCodex: newCodex,
      };
    }

    case 'ADD_SIGNAL':
      return addSignal(state, action.entry);

    case 'MARK_EVENT_SEEN': {
      const newSeen = new Set(state.seenEvents);
      newSeen.add(action.eventId);
      return { ...state, seenEvents: newSeen };
    }

    case 'UNLOCK_CODEX': {
      const newCodex = new Set(state.unlockedCodex);
      newCodex.add(action.entryId);
      return { ...state, unlockedCodex: newCodex };
    }

    case 'CATCH_GOLDEN': {
      const newState = {
        ...state,
        goldenCaught: state.goldenCaught + 1,
      };
      if (action.effect === 'erasure') {
        return { ...newState, doe: Math.max(0, state.doe * 0.9) };
      }
      if (action.effect === 'the-stare') {
        return { ...newState, stareStacks: state.stareStacks + 1 };
      }
      if (action.effect === 'null-windfall') {
        return { ...newState, doe: state.doe + action.bonus, totalDoeEver: state.totalDoeEver + action.bonus, totalDoeAllTime: state.totalDoeAllTime + action.bonus };
      }
      return newState;
    }

    case 'MISS_GOLDEN':
      return { ...state, goldenMissed: state.goldenMissed + 1 };

    case 'SEAL_SURGE':
      return { ...state, surgeSsealed: state.surgeSsealed + 1 };

    case 'FAIL_SURGE': {
      const lost = state.doe * 0.03;
      return { ...state, surgeFailed: state.surgeFailed + 1, doe: Math.max(0, state.doe - lost) };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const newAch = new Set(state.achievements);
      newAch.add(action.id);
      return { ...state, achievements: newAch };
    }

    case 'PLAYER_CHOICE':
      return { ...state, playerChoice: action.choice };

    case 'DOE_SPEAKS_BONUS':
      return { ...state, permanentDpsBonus: state.permanentDpsBonus + 0.1 };

    case 'APPLY_STARE':
      return { ...state, stareStacks: state.stareStacks + 1 };

    case 'ASCEND': {
      const fragments = Math.floor(Math.log10(Math.max(state.totalDoeAllTime, 10)));
      return {
        ...INITIAL_STATE,
        cosmicFragments: state.cosmicFragments + fragments,
        ascensionCount: state.ascensionCount + 1,
        totalTimePlayed: state.totalTimePlayed,
        totalDoeAllTime: state.totalDoeAllTime,
        transcendenceMode: true,
        permanentDpsBonus: state.permanentDpsBonus,
        permanentClickBonus: state.permanentClickBonus,
        stareStacks: state.stareStacks,
        upgrades: new Set(),
        achievements: state.achievements,
        signalLog: [...state.signalLog.slice(-50)],
        unlockedCodex: state.unlockedCodex,
        seenEvents: new Set(),
      };
    }

    case 'LOAD_STATE': {
      const now = Date.now();
      return {
        ...action.state,
        activeBuffs: (action.state.activeBuffs || []).filter((b: ActiveBuff) => b.expiresAt > now),
        leeches: action.state.leeches || [],
      };
    }

    case 'RESET':
      return { ...INITIAL_STATE };

    default:
      return state;
  }
}
