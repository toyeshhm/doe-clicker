import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../store/GameContext';
import { computeClickValue } from '../store/gameReducer';
import { playClick } from '../utils/audio';

const GLYPHS = ['ᛃ', 'ᚨ', 'ᛇ', 'ᚦ', '⌬', '⍟'];

interface Ripple { id: string; x: number; y: number; }

export default function DoeClickable() {
  const { state, dispatch, addParticle } = useGame();
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [scattered, setScattered] = useState(false);
  const clickRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = clickRef.current?.getBoundingClientRect();
    if (rect) {
      addParticle(e.clientX - rect.left, e.clientY - rect.top);
    }
    const clickValue = computeClickValue(state);
    dispatch({ type: 'CLICK', clickValue });
    playClick();

    const rid = Math.random().toString(36).slice(2);
    setRipples(prev => [...prev, { id: rid, x: 130, y: 130 }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rid)), 900);

    setScattered(true);
    setTimeout(() => setScattered(false), 800);
  }, [state, dispatch, addParticle]);

  const orbitDuration = (i: number) => 8 + i * 2.5;

  return (
    <div className="relative flex flex-col items-center">
      <div
        ref={clickRef}
        className="relative cursor-pointer select-none"
        style={{ width: 280, height: 280 }}
        onClick={handleClick}
      >
        <svg width="280" height="280" viewBox="0 0 280 280" style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="voidGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#000" />
              <stop offset="60%" stopColor="#000812" />
              <stop offset="100%" stopColor="#001508" />
            </radialGradient>
            <radialGradient id="auraGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(0,255,65,0)" />
              <stop offset="60%" stopColor="rgba(0,255,65,0.08)" />
              <stop offset="100%" stopColor="rgba(0,255,65,0)" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="outerGlow">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Outer ambient halo */}
          <ellipse cx="140" cy="140" rx="136" ry="136"
            fill="url(#auraGrad)"
            style={{ animation: 'pulse-aura 4s ease-in-out infinite' }}
          />

          {/* Multi-ring aura */}
          <ellipse cx="140" cy="140" rx="124" ry="124"
            fill="none" stroke="rgba(0,255,65,0.18)" strokeWidth="32"
            style={{ animation: 'pulse-aura 3s ease-in-out infinite' }}
          />
          <ellipse cx="140" cy="140" rx="110" ry="110"
            fill="none" stroke="rgba(0,229,255,0.06)" strokeWidth="18"
            style={{ animation: 'pulse-aura 3s ease-in-out infinite 1s' }}
          />
          <ellipse cx="140" cy="140" rx="98" ry="98"
            fill="none" stroke="rgba(0,255,65,0.1)" strokeWidth="12"
            style={{ animation: 'pulse-aura 3s ease-in-out infinite 1.5s' }}
          />

          {/* Main Doe void shape */}
          <path
            d="M140,22 C185,12 235,48 242,92 C250,140 236,188 203,212 C170,238 118,248 80,230 C42,212 14,172 14,132 C14,88 32,44 78,26 C98,16 118,28 140,22 Z"
            fill="url(#voidGrad)"
            stroke="rgba(0,255,65,0.55)"
            strokeWidth="1"
            filter="url(#glow)"
          />
          {/* Secondary stroke for thickness effect */}
          <path
            d="M140,22 C185,12 235,48 242,92 C250,140 236,188 203,212 C170,238 118,248 80,230 C42,212 14,172 14,132 C14,88 32,44 78,26 C98,16 118,28 140,22 Z"
            fill="none"
            stroke="rgba(0,229,255,0.12)"
            strokeWidth="3"
          />

          {/* Deep void center */}
          <ellipse cx="140" cy="140" rx="72" ry="72" fill="url(#voidGrad)" />

          {/* Recursive inner rings */}
          {[54, 40, 28, 18].map((r, i) => (
            <ellipse key={i} cx="140" cy="140" rx={r} ry={r}
              fill="none"
              stroke={i % 2 === 0 ? `rgba(0,255,65,${0.1 + i * 0.025})` : `rgba(0,229,255,${0.06 + i * 0.015})`}
              strokeWidth={i === 3 ? '1' : '0.75'}
            />
          ))}

          {/* Orbiting glyphs */}
          {GLYPHS.map((g, i) => {
            const angle = (360 / GLYPHS.length) * i;
            const scatterAngle = scattered ? angle + (Math.random() - 0.5) * 60 : angle;
            const orbitR = scattered ? 145 : 118;
            const rad = (scatterAngle * Math.PI) / 180;
            const gx = 140 + Math.cos(rad) * orbitR;
            const gy = 140 + Math.sin(rad) * orbitR;
            return (
              <motion.text
                key={i}
                x={gx}
                y={gy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="15"
                fill={i % 2 === 0 ? "rgba(0,255,65,0.75)" : "rgba(0,229,255,0.55)"}
                style={{ fontFamily: 'Share Tech Mono', filter: 'drop-shadow(0 0 4px rgba(0,255,65,0.5))' }}
                animate={{
                  x: [
                    140 + Math.cos(rad) * 118,
                    140 + Math.cos(rad + Math.PI * 2) * 118,
                  ],
                  y: [
                    140 + Math.sin(rad) * 118,
                    140 + Math.sin(rad + Math.PI * 2) * 118,
                  ],
                }}
                transition={{ duration: orbitDuration(i), repeat: Infinity, ease: 'linear' }}
              >
                {g}
              </motion.text>
            );
          })}

          {/* Click ripples */}
          <AnimatePresence>
            {ripples.map(r => (
              <motion.circle
                key={r.id}
                cx={r.x} cy={r.y}
                r="0"
                fill="none"
                stroke="rgba(0,255,65,0.7)"
                strokeWidth="1.5"
                filter="url(#glow)"
                initial={{ r: 0, opacity: 0.8 }}
                animate={{ r: 130, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>

          {/* Amber heartbeat ring */}
          <ellipse
            cx="140" cy="140" rx="82" ry="82"
            fill="none"
            stroke="rgba(255,179,0,0.1)"
            strokeWidth="1.5"
            style={{ animation: 'pulse-aura 5s ease-in-out infinite 2s' }}
          />
        </svg>

        {/* Click particles */}
        <ClickParticles />
      </div>
    </div>
  );
}

function ClickParticles() {
  const { particles } = useGame();
  return (
    <AnimatePresence>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none text-phosphor vt323"
          style={{ left: p.x, top: p.y, fontSize: 18, zIndex: 100 }}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -70, scale: 0.7 }}
          exit={{}}
          transition={{ duration: 0.85, ease: 'easeOut' }}
        >
          +{p.value.toLocaleString()}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
