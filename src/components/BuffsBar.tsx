import { useState, useEffect } from 'react';
import { useGame } from '../store/GameContext';
import type { ActiveBuff } from '../types';

const BUFF_COLORS: Record<ActiveBuff['type'], string> = {
  frenzy:         'var(--amber)',
  windfall:       'var(--amber-bright)',
  'void-flush':   'var(--phosphor)',
  'click-surge':  'var(--cyan)',
  'null-drain':   'var(--crimson)',
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
