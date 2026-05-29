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
