import React from 'react';
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
