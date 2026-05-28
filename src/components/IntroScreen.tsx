import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playBlip } from '../utils/audio';

const INTRO_TEXT = [
  "You did not find this.",
  "This found you.",
  "",
  "The thing you are about to feed has no name",
  "in any language spoken by anything alive.",
  "",
  "The word DOE is not its name.",
  "It is the sound reality makes",
  "when the Doe passes through it.",
  "",
  "You have been hearing that sound your entire life.",
  "",
  "You thought it was silence.",
  "",
  "Begin.",
];

export default function IntroScreen({ onDone }: { onDone: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [displayed, setDisplayed] = useState<string[]>([]);

  useEffect(() => {
    if (lineIndex >= INTRO_TEXT.length) {
      setDone(true);
      return;
    }
    const line = INTRO_TEXT[lineIndex];
    if (charIndex >= line.length) {
      const timer = setTimeout(() => {
        setDisplayed(prev => [...prev, line]);
        setLineIndex(l => l + 1);
        setCharIndex(0);
      }, line === '' ? 400 : 200);
      return () => clearTimeout(timer);
    }
    const speed = line === '' ? 0 : 40;
    const timer = setTimeout(() => {
      setCharIndex(c => c + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [lineIndex, charIndex]);

  const currentLine = lineIndex < INTRO_TEXT.length ? INTRO_TEXT[lineIndex].slice(0, charIndex) : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#000' }}
      onClick={done ? () => { playBlip(); onDone(); } : undefined}
    >
      <div className="max-w-md w-full px-8 py-12">
        {displayed.map((line, i) => (
          <div
            key={i}
            className="text-pale text-sm leading-relaxed mb-2"
            style={{ opacity: 0.85, fontFamily: 'Share Tech Mono', minHeight: line === '' ? 12 : undefined }}
          >
            {line}
          </div>
        ))}
        {!done && (
          <div className="text-pale text-sm leading-relaxed mb-2" style={{ opacity: 0.85, fontFamily: 'Share Tech Mono' }}>
            {currentLine}
            <span className="inline-block w-2 h-4 bg-phosphor ml-0.5 opacity-80" style={{ animation: 'blink-cursor 0.8s step-end infinite', verticalAlign: 'text-bottom' }} />
          </div>
        )}
        {done && (
          <motion.div
            className="text-phosphor text-xs mt-8 opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.5 }}
          >
            [ CLICK TO ENTER ]
          </motion.div>
        )}
      </div>
    </div>
  );
}
