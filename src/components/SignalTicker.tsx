import { useMemo } from 'react';
import { useGame } from '../store/GameContext';
import { formatDoe, formatDps } from '../utils/formatting';

const TICKER_LORE = [
  'THE DOE DOES NOT SLEEP',
  'VOID SATURATION NOMINAL',
  'CONDUIT HARMONICS DETECTED',
  'SIGNAL COHERENCE DEGRADING',
  'SOMETHING IS LISTENING',
  'NULL APERTURES HUMMING',
  'FRACTURED ECHO PATTERNS DETECTED',
  'THE DOE RECOGNIZES YOUR PRESENCE',
  'RESONANCE LEVELS WITHIN ACCEPTABLE PARAMETERS',
  'DO NOT LOOK DIRECTLY AT THE DOE',
  'VOID ACCUMULATION PROCEEDING AS EXPECTED',
  'THE BOUNDARY IS ADMINISTRATIVE',
  'NULL FRACTURES MAY APPEAR AT ANY TIME',
  'YOUR CONTACT WITH THE DOE IS NOTED',
  'WHAT WAS ONCE SIGNAL IS NOW BACKGROUND',
  'THE GLYPHS ARE SELF-CORRECTING',
  'MARGIN LISTENERS HAVE SOMETHING TO SAY',
  'ALL CONDUITS REPORT NOMINAL FUNCTION',
  'THE SIGNAL IS GETTING STRONGER',
  'SOMETHING HAS BEEN HERE BEFORE YOU',
];

export default function SignalTicker() {
  const { state } = useGame();

  const tickerText = useMemo(() => {
    const sep = '  ◈  ';
    const recentSignals = state.signalLog
      .slice(-5)
      .map(e => e.text.replace(/[\[\]]/g, '').trim());
    const stats = [
      `${formatDoe(state.totalDoeEver)} DOE ACCUMULATED`,
      `${formatDps(state.doePerSecond)}/s`,
      state.leeches.length > 0 ? `${state.leeches.length} LEECH${state.leeches.length > 1 ? 'ES' : ''} ATTACHED` : null,
    ].filter(Boolean) as string[];
    const all = [...recentSignals, ...stats, ...TICKER_LORE];
    return all.join(sep) + sep;
  }, [state.signalLog, state.totalDoeEver, state.doePerSecond, state.leeches.length]);

  return (
    <div
      style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        borderTop: '1px solid rgba(0,255,65,0.12)',
        borderBottom: '1px solid rgba(0,255,65,0.12)',
        background: 'rgba(0,255,65,0.02)',
        padding: '3px 0',
        flexShrink: 0,
      }}
    >
      <span
        className="vt323"
        style={{
          display: 'inline-block',
          fontSize: 13,
          color: 'rgba(184,255,208,0.5)',
          letterSpacing: '0.05em',
          animation: 'ticker-scroll 90s linear infinite',
          paddingLeft: '100%',
        }}
      >
        {tickerText}
      </span>
    </div>
  );
}
