import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { UPGRADES } from '../data/upgrades';
import type { UpgradeDef } from '../types';
import { playPurchase } from '../utils/audio';

const TYPE_ICONS: Record<string, string> = {
  click: '⊛', all: '◈', building: '⌬', lore: 'ᛇ',
};

const TYPE_ICON_COLORS: Record<string, string> = {
  click: 'var(--cyan)',
  all: 'var(--amber-bright)',
  building: 'var(--phosphor)',
  lore: '#bb44ff',
};

export default function UpgradesPanel() {
  const { state, dispatch, addToast } = useGame();

  const visibleUpgrades = UPGRADES.filter(u => {
    if (state.upgrades.has(u.id)) return true;
    if (u.requires && (state.conduits[u.requires.conduit] || 0) < u.requires.count) return false;
    return state.doe >= u.cost / 10 || state.totalDoeEver >= u.cost / 10;
  });

  const handleBuy = (u: UpgradeDef) => {
    if (state.upgrades.has(u.id) || state.doe < u.cost) return;
    dispatch({ type: 'BUY_UPGRADE', upgradeId: u.id });
    addToast(`[ INSTALLED: ${u.name} ]`, 'phosphor');
    playPurchase();
  };

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header">[ ACQUIRED KNOWLEDGE ]</div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-1.5">
          {visibleUpgrades.map(u => (
            <UpgradeTile key={u.id} upgrade={u} onBuy={handleBuy} />
          ))}
          {visibleUpgrades.length === 0 && (
            <div className="col-span-2 text-center text-pale text-xs py-8 opacity-40">
              Feed the Doe to reveal upgrades.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UpgradeTile({ upgrade: u, onBuy }: { upgrade: UpgradeDef; onBuy: (u: UpgradeDef) => void }) {
  const { state } = useGame();
  const [showTooltip, setShowTooltip] = useState(false);
  const purchased = state.upgrades.has(u.id);
  const affordable = state.doe >= u.cost;
  const iconColor = TYPE_ICON_COLORS[u.type] || 'var(--phosphor)';

  const cls = [
    'upgrade-tile',
    `type-${u.type}`,
    purchased ? 'purchased' : '',
    !purchased && !affordable ? 'opacity-45' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      style={{ padding: '7px 8px', minHeight: 54, position: 'relative' }}
      onClick={() => !purchased && onBuy(u)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-start gap-1.5">
        {/* Icon box */}
        <div className="upgrade-icon-box flex-shrink-0">
          <span style={{ fontSize: 15, color: iconColor, lineHeight: 1 }}>
            {TYPE_ICONS[u.type] || '◈'}
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-xs leading-tight" style={{ color: purchased ? 'var(--pale-void)' : 'var(--phosphor)', fontSize: 10.5 }}>
            {purchased
              ? <s style={{ opacity: 0.6 }}>{u.name}</s>
              : <span style={{ textShadow: affordable ? '0 0 6px rgba(0,255,65,0.3)' : 'none' }}>{u.name}</span>
            }
          </div>
          <div className="vt323 mt-0.5" style={{ fontSize: 14, color: purchased ? 'var(--phosphor)' : affordable ? 'var(--amber-bright)' : 'var(--pale-void)', opacity: purchased ? 0.7 : 1 }}>
            {purchased ? '✓ INSTALLED' : `${(u.cost).toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="panel"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            width: 210,
            marginBottom: 6,
            padding: '10px 12px',
            zIndex: 50,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            boxShadow: '0 0 30px rgba(0,0,0,0.9), 0 0 15px rgba(0,255,65,0.08)',
          }}
        >
          <div className="text-xs mb-1" style={{ color: iconColor, textShadow: `0 0 8px ${iconColor}66` }}>{u.name}</div>
          <div className="text-pale text-xs leading-relaxed" style={{ opacity: 0.8, fontSize: 10 }}>{u.description}</div>
          {u.flavor && (
            <div className="text-xs italic mt-1.5" style={{ color: 'var(--amber)', opacity: 0.65, fontSize: 9.5 }}>{u.flavor}</div>
          )}
          <div className="mt-1.5 text-xs" style={{ color: 'var(--amber-bright)', fontSize: 10 }}>
            {u.cost.toLocaleString()} DOE
          </div>
        </div>
      )}
    </div>
  );
}
