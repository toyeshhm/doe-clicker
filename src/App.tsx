import { useState } from 'react';
import { GameProvider, useGame } from './store/GameContext';
import HUD from './components/HUD';
import DoeClickable from './components/DoeClickable';
import UpgradesPanel from './components/UpgradesPanel';
import ConduitsPanel from './components/ConduitsPanel';
import SignalLog from './components/SignalLog';
import Codex from './components/Codex';
import StatsPanel from './components/StatsPanel';
import AchievementsPanel from './components/AchievementsPanel';
import MilestoneModal from './components/MilestoneModal';
import GoldenDoeEvent from './components/GoldenDoeEvent';
import NullSurgeEvent from './components/NullSurgeEvent';
import AscensionScreen from './components/AscensionScreen';
import IntroScreen from './components/IntroScreen';
import Toasts from './components/Toasts';
import SignalTicker from './components/SignalTicker';
import BuffsBar from './components/BuffsBar';
import ResonanceBar from './components/ResonanceBar';
import VoidLeechLayer from './components/VoidLeechLayer';
import NullFractureEvent from './components/NullFractureEvent';
import { formatDoe, formatDps } from './utils/formatting';

type Tab = 'upgrades' | 'codex' | 'stats' | 'achievements';

/* Animated nebula color layer — blobs float and breathe behind all UI */
function NebulaLayer() {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
      {/* Magenta — top right */}
      <div className="nebula-blob" style={{
        width: 720, height: 520,
        background: 'radial-gradient(circle at center, rgba(255,0,110,0.24) 0%, rgba(200,0,80,0.10) 50%, transparent 70%)',
        top: -140, right: -80,
        animationName: 'nebula-drift-a', animationDuration: '20s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '0s',
      }} />
      {/* Violet — bottom left */}
      <div className="nebula-blob" style={{
        width: 820, height: 640,
        background: 'radial-gradient(circle at center, rgba(100,40,255,0.21) 0%, rgba(60,0,200,0.08) 50%, transparent 70%)',
        bottom: -160, left: -130,
        animationName: 'nebula-drift-b', animationDuration: '26s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '-9s',
      }} />
      {/* Teal — center right */}
      <div className="nebula-blob" style={{
        width: 560, height: 560,
        background: 'radial-gradient(circle at center, rgba(0,220,200,0.18) 0%, rgba(0,180,160,0.07) 50%, transparent 70%)',
        top: '25%', right: -90,
        animationName: 'nebula-drift-c', animationDuration: '19s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '-5s',
      }} />
      {/* Orange — lower right */}
      <div className="nebula-blob" style={{
        width: 500, height: 420,
        background: 'radial-gradient(circle at center, rgba(255,120,40,0.17) 0%, rgba(200,80,0,0.07) 50%, transparent 70%)',
        bottom: '8%', right: '18%',
        animationName: 'nebula-drift-a', animationDuration: '23s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '-13s',
      }} />
      {/* Electric blue — center left */}
      <div className="nebula-blob" style={{
        width: 620, height: 520,
        background: 'radial-gradient(circle at center, rgba(40,100,255,0.16) 0%, rgba(0,60,200,0.06) 50%, transparent 70%)',
        top: '38%', left: -70,
        animationName: 'nebula-drift-b', animationDuration: '17s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '-7s',
      }} />
      {/* Rose — upper center */}
      <div className="nebula-blob" style={{
        width: 420, height: 360,
        background: 'radial-gradient(circle at center, rgba(255,60,180,0.14) 0%, rgba(180,0,120,0.05) 50%, transparent 70%)',
        top: '10%', left: '35%',
        animationName: 'nebula-drift-c', animationDuration: '31s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '-18s',
      }} />
    </div>
  );
}

/* Grain/noise overlay — single fixed div, z-index below UI but above body bg */
function NoiseOverlay() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9997,
        opacity: 0.028,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
      }}
    />
  );
}

function GameUI() {
  const { state, currentQuote, isGlitching } = useGame();
  const [tab, setTab] = useState<Tab>('upgrades');

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isGlitching ? 'glitch-active' : ''} ${state.transcendenceMode ? 'transcendence-mode' : ''}`}>

      <HUD />
      <SignalTicker />
      <BuffsBar />

      {/* 3-column layout */}
      <div className="flex flex-1 gap-2 p-2" style={{ minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT — The Doe */}
        <div className="flex flex-col gap-2 overflow-hidden" style={{ width: 316, flexShrink: 0 }}>
          <div className="panel flex flex-col items-center p-3 gap-2 flex-1">

            {/* Doe count — dramatic */}
            <div className="text-center w-full" style={{ paddingTop: 4 }}>
              <div className="vt323 doe-main-count" style={{ fontSize: 54, lineHeight: 1.0, color: 'var(--amber-bright)' }}>
                {formatDoe(state.doe)}
              </div>
              <div className="doe-label">DOE ACCUMULATED</div>
            </div>

            {/* Divider */}
            <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,255,65,0.3) 30%, rgba(0,255,65,0.3) 70%, transparent)' }} />

            {/* Sub-stats */}
            <div className="flex gap-0 w-full">
              <div className="flex-1 text-center" style={{ borderRight: '1px solid rgba(0,255,65,0.15)', padding: '4px 0' }}>
                <div className="vt323 doe-stat-value" style={{ fontSize: 20, lineHeight: 1 }}>{formatDps(state.doePerSecond)}</div>
                <div className="doe-stat-label">PER SECOND</div>
              </div>
              <div className="flex-1 text-center" style={{ padding: '4px 0' }}>
                <div className="vt323 doe-stat-value" style={{ fontSize: 20, lineHeight: 1 }}>{formatDps(state.doePerClick)}</div>
                <div className="doe-stat-label">PER CLICK</div>
              </div>
            </div>

            <ResonanceBar />

            {/* The Doe SVG + leeches */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <DoeClickable />
              <VoidLeechLayer />
            </div>

            {/* Lore quote */}
            <div className="lore-quote-box w-full p-2 text-center" style={{ marginTop: 'auto' }}>
              <div className="text-pale text-xs italic leading-relaxed" style={{ fontSize: 10, opacity: 0.7, paddingLeft: 12 }}>
                {currentQuote}
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE — Tabs */}
        <div className="flex flex-col flex-1 gap-2 overflow-hidden" style={{ minWidth: 0 }}>
          {/* Tab bar */}
          <div className="flex gap-1">
            {(['upgrades', 'codex', 'achievements', 'stats'] as Tab[]).map(t => {
              const labels: Record<Tab, string> = {
                upgrades: '[ UPGRADES ]',
                codex: '[ CODEX ]',
                achievements: '[ ACHIEVEMENTS ]',
                stats: '[ RECORDS ]',
              };
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  className="btn-terminal text-xs px-3 py-1"
                  style={isActive ? { background: 'var(--phosphor)', color: '#000', textShadow: 'none', boxShadow: '0 0 16px rgba(0,255,65,0.5)' } : {}}
                  onClick={() => setTab(t)}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            {tab === 'upgrades' && <UpgradesPanel />}
            {tab === 'codex' && <Codex />}
            {tab === 'achievements' && <AchievementsPanel />}
            {tab === 'stats' && <StatsPanel />}
          </div>

          <SignalLog />
        </div>

        {/* RIGHT — Conduits */}
        <div className="flex flex-col overflow-hidden" style={{ width: 292, flexShrink: 0 }}>
          <ConduitsPanel />
        </div>
      </div>

      <MilestoneModal />
      <GoldenDoeEvent />
      <NullFractureEvent />
      <NullSurgeEvent />
      <AscensionScreen />
      <Toasts />
    </div>
  );
}

export default function App() {
  const [introDone, setIntroDone] = useState(() => {
    return localStorage.getItem('doe-intro-seen') === '1';
  });

  const handleIntroDone = () => {
    localStorage.setItem('doe-intro-seen', '1');
    setIntroDone(true);
  };

  return (
    <GameProvider>
      <NebulaLayer />
      <NoiseOverlay />
      {!introDone && <IntroScreen onDone={handleIntroDone} />}
      <GameUI />
    </GameProvider>
  );
}
