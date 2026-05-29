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
