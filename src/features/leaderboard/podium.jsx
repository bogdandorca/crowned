// ─────────────────────────────────────────────────────────────
// Crowned — Podium (top 3)
// ─────────────────────────────────────────────────────────────

const MEDAL = {
  1: { ring: 'gold',     label: '1', tone: '#8b6b34', av: 70 },
  2: { ring: 'platinum', label: '2', tone: '#7f8b8e', av: 58 },
  3: { ring: 'bronze',   label: '3', tone: '#a88973', av: 58 },
};

function MedalBadge({ rank }) {
  const m = MEDAL[rank];
  const grad = rank === 1 ? 'gold-fill' : rank === 2 ? 'plat-fill' : 'bronze-fill';
  return (
    <div style={{
      position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
      width: 26, height: 26, borderRadius: '50%', zIndex: 3,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 8px 18px rgba(84,65,42,0.14)',
    }} className={grad}>
      <span className="sans" style={{ fontSize: 12, fontWeight: 800, color: '#3a3229', fontVariantNumeric: 'lining-nums tabular-nums' }}>{rank}</span>
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
      color: up ? '#56634e' : '#a88973', letterSpacing: 0.2,
    }}>
      <span style={{ fontSize: 9 }}>{up ? '▲' : '▼'}</span>{Math.abs(delta)}
    </span>
  );
}

function YouBadge() {
  return (
    <span className="sans" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '4px 8px', borderRadius: 100,
      fontSize: 9, fontWeight: 800, letterSpacing: 1.3, textTransform: 'uppercase',
      color: '#56634e', background: 'rgba(86,99,78,0.12)',
      border: '1px solid rgba(86,99,78,0.24)',
      whiteSpace: 'nowrap',
    }}>
      You
    </span>
  );
}

function PodiumCard({ donor, animate, onShare, idx, activeDonorId }) {
  const m = MEDAL[donor.rank];
  const isOne = donor.rank === 1;
  const isActiveDonor = donor.id === activeDonorId;
  return (
    <div
      className={animate ? 'podium-pop' : ''}
      style={{
        minWidth: 0, minHeight: isOne ? 232 : 196, display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-start', padding: isOne ? 20 : 16, paddingRight: isOne ? 112 : 92,
        position: 'relative',
        borderRadius: 14, cursor: 'pointer',
        background: isOne
          ? 'linear-gradient(155deg, rgba(255,255,255,0.76), rgba(236,221,226,0.64))'
          : isActiveDonor
            ? 'linear-gradient(145deg, rgba(255,250,241,0.72), rgba(230,237,240,0.54))'
            : 'rgba(255,255,255,0.48)',
        border: isActiveDonor
          ? '1px solid rgba(86,99,78,0.34)'
          : isOne ? '1px solid rgba(142,109,55,0.24)' : '1px solid rgba(96,73,45,0.12)',
        boxShadow: isActiveDonor
          ? '0 22px 54px rgba(86,99,78,0.14)'
          : isOne ? '0 24px 58px rgba(84,65,42,0.12)' : '0 16px 38px rgba(84,65,42,0.08)',
        animationDelay: animate ? (idx * 90) + 'ms' : '0ms',
      }}
      onClick={() => onShare(donor)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="sans" style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
          color: 'rgba(58,50,41,0.46)',
        }}>
          No. {donor.rank}
        </div>
        {isActiveDonor && <YouBadge />}
      </div>
      <div className="patron-card-avatar" style={{
        position: 'absolute', top: isOne ? 20 : 16, right: isOne ? 20 : 16,
      }}>
        <Avatar donor={donor} size={m.av} ring={m.ring} initialsColor="#4a3b27" />
        <MedalBadge rank={donor.rank} />
      </div>

      <div>
        <div className="serif" style={{
          marginTop: isOne ? 18 : 14, lineHeight: 0.98,
          fontSize: isOne ? 34 : 25, fontWeight: 600, color: '#302b26', letterSpacing: -0.3,
        }}>
          {fullName(donor)}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 'auto', paddingTop: 22 }}>
        <div className="sans" style={{
          fontWeight: 800, letterSpacing: -0.3, whiteSpace: 'nowrap',
          fontSize: isOne ? 22 : 17, fontVariantNumeric: 'tabular-nums',
          color: '#7c5f30',
        }}>
          <AnimatedNumber value={donor.amount} animate={animate} />
        </div>
        <button className="share-mini" onClick={(e) => { e.stopPropagation(); onShare(donor); }} aria-label="Share rank">
          <ShareGlyph size={12} /> Share
        </button>
      </div>
    </div>
  );
}

function Badge({ label, rank }) {
  if (!label) return null;
  const grad = rank === 1 ? 'gold' : rank === 2 ? 'platinum' : 'bronze';
  return (
    <span className="sans" style={{
      display: 'inline-flex', marginTop: 10, fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2,
      textTransform: 'uppercase', padding: '5px 9px', borderRadius: 100,
      color: 'rgba(58,50,41,0.58)',
      background: 'rgba(255,250,241,0.52)',
      border: '1px solid rgba(96,73,45,0.16)',
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

function Podium({ top3, animate, onShare, accent, activeDonorId }) {
  const ordered = top3.filter(Boolean);
  const leader = ordered[0];
  return (
    <div style={{ position: 'relative', marginTop: 6 }}>
      {leader && (
        <div className="patron-hero" style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24,
          alignItems: 'end', marginBottom: 26,
        }}>
          <div>
            <div className="sans" style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 2.4, textTransform: 'uppercase',
              color: 'rgba(58,50,41,0.45)', marginBottom: 10,
            }}>Leading patron</div>
            <div className="serif patron-hero-name" style={{ fontSize: 60, lineHeight: 0.9, fontWeight: 600, letterSpacing: 0, color: '#2f2a25' }}>
              {leader.first}<br />{leader.last || ''}
            </div>
            <div className="sans" style={{
              marginTop: 14, fontSize: 28, fontWeight: 800,
              color: '#7c5f30', fontVariantNumeric: 'tabular-nums',
            }}>
              <AnimatedNumber value={leader.amount} animate={animate} />
            </div>
          </div>
          <div className="sans" style={{
            maxWidth: 250, fontSize: 14, lineHeight: 1.55,
            color: 'rgba(58,50,41,0.58)',
          }}>
            Recognition with the restraint of a private arts benefit: calm, generous, and intentionally understated.
          </div>
        </div>
      )}
      <div className="patron-grid" style={{
        position: 'relative', zIndex: 2,
        display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12,
      }}>
        {ordered.map((d, i) => (
          <PodiumCard key={d.id} donor={d} animate={animate} onShare={onShare} idx={i} activeDonorId={activeDonorId} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Podium, PodiumCard, Badge, MedalBadge, DeltaChip, YouBadge, ShareGlyph });
