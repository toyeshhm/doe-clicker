import { ACHIEVEMENTS } from '../data/achievements';
import { useGame } from '../store/GameContext';

const CATEGORIES: { label: string; ids: string[]; color: string; glyph: string }[] = [
  { label: 'DOE MILESTONES', ids: ['doe-1k','doe-100k','doe-10m','doe-1b','doe-100b','doe-10t','doe-1q','doe-1qt'], color: 'var(--amber)', glyph: '◈' },
  { label: 'CLICK MILESTONES', ids: ['click-100','click-1k','click-10k','click-100k','click-1m'], color: 'var(--cyan)', glyph: '⊛' },
  { label: 'CONDUIT ARRAY', ids: ['bld-first','bld-10any','bld-50any','bld-100any','bld-200any','bld-all14','bld-500total'], color: 'var(--phosphor)', glyph: '⌬' },
  { label: 'STORY', ids: ['story-act1','story-act2','story-act3','story-act4','story-act5'], color: 'var(--transcendent)', glyph: '▓' },
  { label: 'GOLDEN EVENTS', ids: ['golden-1','golden-10','golden-100','golden-1000'], color: 'var(--amber-bright)', glyph: '✦' },
  { label: 'ASCENSION', ids: ['asc-1','asc-5','asc-10'], color: 'var(--nebula-teal, #00f5d4)', glyph: '◉' },
  { label: 'SECRETS', ids: ['secret-warned','secret-codex','secret-exact'], color: 'var(--crimson)', glyph: '▒' },
];

const ACH_MAP = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

export default function AchievementsPanel() {
  const { state } = useGame();
  const total = ACHIEVEMENTS.length;
  const unlocked = ACHIEVEMENTS.filter(a => state.achievements.has(a.id)).length;

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center justify-between">
        <span>[ ACHIEVEMENT LOG ]</span>
        <span style={{ color: 'var(--amber)', fontSize: 10, letterSpacing: '0.1em' }}>
          {unlocked} / {total} UNLOCKED
        </span>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 10px' }}>
        {CATEGORIES.map(cat => {
          const catAchs = cat.ids.map(id => ACH_MAP[id]).filter(Boolean);
          const catUnlocked = catAchs.filter(a => state.achievements.has(a.id)).length;

          return (
            <div key={cat.label} style={{ marginBottom: 14 }}>
              {/* Category header */}
              <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                <span style={{ color: cat.color, fontSize: 13, fontFamily: 'VT323, monospace', opacity: 0.9 }}>
                  {cat.glyph}
                </span>
                <span style={{ fontSize: 9, letterSpacing: '0.22em', color: cat.color, opacity: 0.75, textTransform: 'uppercase' }}>
                  {cat.label}
                </span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${cat.color}44, transparent)` }} />
                <span style={{ fontSize: 9, color: cat.color, opacity: 0.55, letterSpacing: '0.05em' }}>
                  {catUnlocked}/{catAchs.length}
                </span>
              </div>

              {/* Achievement grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {catAchs.map(ach => {
                  const isUnlocked = state.achievements.has(ach.id);
                  const isSecretLocked = ach.secret && !isUnlocked;

                  return (
                    <div
                      key={ach.id}
                      style={{
                        border: `1px solid ${isUnlocked ? cat.color + '88' : 'rgba(255,255,255,0.08)'}`,
                        borderLeft: `3px solid ${isUnlocked ? cat.color : 'rgba(255,255,255,0.12)'}`,
                        background: isUnlocked
                          ? `linear-gradient(135deg, ${cat.color}0f 0%, transparent 60%)`
                          : 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)',
                        padding: '6px 8px',
                        opacity: isUnlocked ? 1 : 0.38,
                        position: 'relative',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {/* Unlocked glow dot */}
                      {isUnlocked && (
                        <div style={{
                          position: 'absolute', top: 5, right: 6,
                          width: 5, height: 5, borderRadius: '50%',
                          background: cat.color,
                          boxShadow: `0 0 6px ${cat.color}, 0 0 12px ${cat.color}88`,
                        }} />
                      )}

                      <div style={{
                        fontSize: 10.5,
                        color: isUnlocked ? cat.color : 'var(--pale-void)',
                        textShadow: isUnlocked ? `0 0 8px ${cat.color}88` : 'none',
                        marginBottom: 2,
                        paddingRight: isUnlocked ? 14 : 0,
                        fontFamily: 'Share Tech Mono, monospace',
                        lineHeight: 1.2,
                      }}>
                        {isSecretLocked ? '[ ??? ]' : ach.name}
                      </div>

                      <div style={{
                        fontSize: 9,
                        color: 'var(--pale-void)',
                        opacity: 0.65,
                        lineHeight: 1.3,
                        fontFamily: 'Share Tech Mono, monospace',
                      }}>
                        {isSecretLocked ? 'CLASSIFIED' : ach.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
