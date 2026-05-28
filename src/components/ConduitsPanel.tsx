import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { CONDUITS } from '../data/conduits';
import type { Conduit } from '../types';
import { conduitCostBulk, maxAffordable, formatDoe, formatDps } from '../utils/formatting';
import { playPurchase } from '../utils/audio';

type BulkMode = 1 | 10 | 100 | 'max';

export default function ConduitsPanel() {
  const [bulkMode, setBulkMode] = useState<BulkMode>(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { state, dispatch, addToast } = useGame();
  const isAct3Plus = state.totalDoeEver >= 1e7;
  const totalDps = state.doePerSecond;

  const handleBuy = (c: Conduit) => {
    const owned = state.conduits[c.id] || 0;
    let qty: number;
    if (bulkMode === 'max') {
      qty = maxAffordable(c.baseCost, owned, state.doe);
    } else {
      qty = bulkMode as number;
    }
    if (qty === 0) return;
    const cost = conduitCostBulk(c.baseCost, owned, qty);
    if (state.doe < cost) return;
    dispatch({ type: 'BUY_CONDUIT', conduitId: c.id, quantity: qty, cost });
    addToast(`[ ${c.name.toUpperCase()} ×${qty} ]`, 'phosphor');
    playPurchase();
  };

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center justify-between">
        <span>[ CONDUIT ARRAY ]</span>
        <div className="flex gap-1">
          {([1, 10, 100, 'max'] as BulkMode[]).map(m => (
            <button
              key={String(m)}
              className="btn-terminal text-xs px-1.5 py-0.5"
              style={bulkMode === m
                ? { background: 'var(--phosphor)', color: '#000', textShadow: 'none', boxShadow: '0 0 10px rgba(0,255,65,0.4)' }
                : {}}
              onClick={() => setBulkMode(m)}
            >
              {m === 'max' ? 'MAX' : `×${m}`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {CONDUITS.map(c => {
          const owned = state.conduits[c.id] || 0;
          let qty: number;
          if (bulkMode === 'max') {
            qty = Math.max(1, maxAffordable(c.baseCost, owned, state.doe));
          } else {
            qty = bulkMode as number;
          }
          const cost = conduitCostBulk(c.baseCost, owned, qty);
          const affordable = state.doe >= cost && (bulkMode !== 'max' || maxAffordable(c.baseCost, owned, state.doe) > 0);
          const unlocked = state.totalDoeEver >= c.baseCost / 10 || owned > 0;
          if (!unlocked) return null;

          const conduitDps = c.baseDps * owned;
          const dpsPercent = totalDps > 0 && owned > 0 ? Math.min(100, (conduitDps / totalDps) * 100) : 0;
          const isExpanded = expanded === c.id;
          const showCorrupted = isAct3Plus && owned > 0 && c.corruptedDesc;

          return (
            <div key={c.id}>
              <div
                className={`conduit-row flex items-stretch gap-0 ${affordable ? 'affordable' : 'unaffordable'}`}
                onClick={() => {
                  if (affordable) handleBuy(c);
                  setExpanded(isExpanded ? null : c.id);
                }}
              >
                {/* Icon box */}
                <div className="conduit-icon-box">
                  <span className="vt323 text-amber" style={{ fontSize: 22 }}>{c.glyph}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 px-2 py-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-phosphor text-xs truncate" style={{ textShadow: affordable ? '0 0 6px rgba(0,255,65,0.3)' : 'none' }}>
                      {c.name}
                    </span>
                    <div className="conduit-count-badge">{owned}</div>
                  </div>

                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs" style={{ color: affordable ? 'var(--amber-bright)' : 'var(--pale-void)', opacity: affordable ? 0.9 : 0.5, fontSize: 10 }}>
                      {formatDoe(cost)} DOE
                    </span>
                    {owned > 0 && (
                      <span className="text-xs" style={{ color: 'var(--cyan)', opacity: 0.65, fontSize: 10 }}>
                        {formatDps(conduitDps)}/s
                      </span>
                    )}
                  </div>

                  {/* DPS bar */}
                  {owned > 0 && (
                    <div className="conduit-dps-bar-track">
                      <div className="conduit-dps-bar-fill" style={{ width: `${dpsPercent}%` }} />
                    </div>
                  )}

                  {showCorrupted && (
                    <div className="text-crimson mt-0.5" style={{ fontSize: 9, opacity: 0.7 }}>
                      {c.corruptedDesc}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ background: 'rgba(0,255,65,0.03)', borderLeft: '3px solid rgba(0,255,65,0.2)', padding: '8px 12px 8px 10px', marginBottom: 1 }}>
                  <div className="text-pale italic text-xs mb-2 leading-relaxed" style={{ opacity: 0.75, fontSize: 10 }}>
                    {c.description}
                  </div>
                  <div className="text-xs mb-2" style={{ color: 'var(--cyan)', opacity: 0.6, fontSize: 10 }}>
                    Base {c.baseDps}/s × {owned} = {formatDps(c.baseDps * owned)}/s
                  </div>
                  <div className="flex gap-2">
                    {([1, 10, 100] as number[]).map(q => {
                      const qcost = conduitCostBulk(c.baseCost, owned, q);
                      const canAfford = state.doe >= qcost;
                      return (
                        <button
                          key={q}
                          className="btn-terminal text-xs"
                          disabled={!canAfford}
                          style={{ fontSize: 10, padding: '2px 6px' }}
                          onClick={e => {
                            e.stopPropagation();
                            if (!canAfford) return;
                            dispatch({ type: 'BUY_CONDUIT', conduitId: c.id, quantity: q, cost: qcost });
                            playPurchase();
                          }}
                        >
                          ×{q} <span style={{ opacity: 0.7 }}>({formatDoe(qcost)})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
