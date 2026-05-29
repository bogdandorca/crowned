// ─────────────────────────────────────────────────────────────
// Crowned — Podium (top 3)
// ─────────────────────────────────────────────────────────────

const MEDAL = {
  1: { ring: 'gold',     label: '1', tone: '#f5c84b', base: 64, av: 80, dim: 'rgba(245,200,75,0.55)' },
  2: { ring: 'platinum', label: '2', tone: '#d8dee6', base: 44, av: 58, dim: 'rgba(216,222,230,0.45)' },
  3: { ring: 'bronze',   label: '3', tone: '#c98a4b', base: 30, av: 58, dim: 'rgba(201,138,75,0.45)' },
};

function MedalBadge({ rank }) {
  const m = MEDAL[rank];
  const grad = rank === 1 ? 'gold-fill' : rank === 2 ? 'plat-fill' : 'bronze-fill';
  return (
    <div style={{
      position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
      width: 28, height: 28, borderRadius: '50%', zIndex: 3,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 3px 8px rgba(0,0,0,0.45)',
    }} className={grad}>
      <span className="sans" style={{ fontSize: 14, fontWeight: 800, color: '#1a1206', fontVariantNumeric: 'lining-nums tabular-nums' }}>{rank}</span>
    </div>
  );
}

function DeltaChip({ delta }) {
  if (!delta) return (
    <span className="sans" style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', letterSpacing: 0.4 }}>—</span>
  );
  const up = delta > 0;
  return (
    <span className="sans" style={{
      display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 700,
      color: up ? '#7fd6a0' : '#e09a9a', letterSpacing: 0.2,
    }}>
      <span style={{ fontSize: 9 }}>{up ? '▲' : '▼'}</span>{Math.abs(delta)}
    </span>
  );
}

function PodiumCard({ donor, animate, onShare, idx }) {
  const m = MEDAL[donor.rank];
  const isOne = donor.rank === 1;
  return (
    <div
      className={animate ? 'podium-pop' : ''}
      style={{
        flex: isOne ? '1.18' : '1', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end', minWidth: 0,
        animationDelay: animate ? (idx * 90) + 'ms' : '0ms',
      }}
    >
      {/* floating card content */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {isOne && (
          <Crown size={34} style={{ marginBottom: 4, filter: 'drop-shadow(0 2px 6px rgba(245,200,75,0.6))' }} />
        )}
        <div style={{ position: 'relative' }}>
          {isOne && (
            <div className={animate ? 'aura-pulse' : ''} aria-hidden style={{
              position: 'absolute', inset: -22, borderRadius: '50%', zIndex: 0,
              background: 'radial-gradient(circle, rgba(245,200,75,0.5), transparent 68%)',
            }} />
          )}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <Avatar donor={donor} size={m.av} ring={m.ring} />
            <MedalBadge rank={donor.rank} />
          </div>
        </div>
        <div className="serif" style={{
          marginTop: 14, textAlign: 'center', lineHeight: 1.06,
          fontSize: isOne ? 19 : 15, fontWeight: 600, padding: '0 2px',
        }}>
          <span className={isOne ? 'gold-grad' : 'soft-name'}>{donor.first}</span><br/>
          <span className={isOne ? 'gold-grad' : 'soft-name'}>{donor.last}</span>
        </div>
        <Badge label={donor.badge} rank={donor.rank} />
        <div className={'sans ' + (isOne ? 'gold-grad clip-fix' : '')} style={{
          marginTop: 8, fontWeight: 800, letterSpacing: -0.8, whiteSpace: 'nowrap',
          fontSize: isOne ? 21 : 15.5, fontVariantNumeric: 'tabular-nums',
          color: isOne ? undefined : 'rgba(255,255,255,0.92)',
        }}>
          <AnimatedNumber value={donor.amount} animate={animate} />
        </div>
        <button className="share-mini" onClick={() => onShare(donor)} aria-label="Share rank">
          <ShareGlyph size={12} /> Share
        </button>
      </div>

      {/* pedestal base */}
      <div style={{
        marginTop: 10, width: '86%', height: m.base, borderRadius: '8px 8px 0 0',
        position: 'relative', overflow: 'hidden',
        background: isOne
          ? 'linear-gradient(#1d2435, #141a28)'
          : 'linear-gradient(#1a2030, #11161f)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        borderTop: `2px solid ${m.tone}`,
      }}>
        {animate && <div className="shimmer-sweep" style={{ position: 'absolute', inset: 0, opacity: isOne ? 1 : 0.55 }} />}
        <span className="serif" style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: isOne ? 32 : 22, fontWeight: 600, opacity: 0.5,
          color: m.tone, lineHeight: 1,
          fontVariantNumeric: 'lining-nums tabular-nums',
        }}>{donor.rank}</span>
      </div>
    </div>
  );
}

function Badge({ label, rank }) {
  if (!label) return null;
  const grad = rank === 1 ? 'gold' : rank === 2 ? 'platinum' : 'bronze';
  return (
    <span className="sans" style={{
      marginTop: 7, fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2,
      textTransform: 'uppercase', padding: '3px 9px', borderRadius: 100,
      color: rank <= 3 ? '#1a1206' : 'rgba(245,200,75,0.92)',
      background: rank === 1 ? 'linear-gradient(100deg,#fff3c4,#f5c84b)'
        : rank === 2 ? 'linear-gradient(100deg,#fff,#d8dee6)'
        : rank === 3 ? 'linear-gradient(100deg,#f0c9a0,#c98a4b)'
        : 'rgba(245,200,75,0.1)',
      border: rank <= 3 ? 'none' : '1px solid rgba(245,200,75,0.25)',
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function ShareGlyph({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="18" cy="5" r="2.4" stroke={color} strokeWidth="1.8"/>
      <circle cx="6" cy="12" r="2.4" stroke={color} strokeWidth="1.8"/>
      <circle cx="18" cy="19" r="2.4" stroke={color} strokeWidth="1.8"/>
      <path d="M8.1 10.9l7.8-4.6M8.1 13.1l7.8 4.6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function Podium({ top3, animate, onShare, accent }) {
  // visual order: #2, #1, #3
  const ordered = [top3[1], top3[0], top3[2]].filter(Boolean);
  return (
    <div style={{ position: 'relative', padding: '0 14px', marginTop: 6 }}>
      <LightRays animate={animate} accent={accent} />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {ordered.map((d, i) => (
          <PodiumCard key={d.id} donor={d} animate={animate} onShare={onShare} idx={i} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Podium, PodiumCard, Badge, MedalBadge, DeltaChip, ShareGlyph });
