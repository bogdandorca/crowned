// ─────────────────────────────────────────────────────────────
// Crowned — list rows (#4–10) with FLIP reshuffle
// ─────────────────────────────────────────────────────────────

function RowYouBadge() {
  return (
    <span className="sans" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '3px 7px', borderRadius: 100,
      fontSize: 8.5, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
      color: '#56634e', background: 'rgba(86,99,78,0.12)',
      border: '1px solid rgba(86,99,78,0.22)',
      whiteSpace: 'nowrap',
    }}>
      You
    </span>
  );
}

function LeaderRow({ donor, animate, onShare, activeDonorId }) {
  const isActiveDonor = donor.id === activeDonorId;
  return (
    <div
      className="leader-row"
      onClick={() => onShare(donor)}
      role="button"
      style={{
        display: 'flex', alignItems: 'center', gap: 13,
        padding: isActiveDonor ? '15px 12px' : '15px 0',
        position: 'relative', cursor: 'pointer',
        background: isActiveDonor ? 'rgba(255,250,241,0.46)' : 'transparent',
        borderRadius: isActiveDonor ? 14 : 0,
        border: isActiveDonor ? '1px solid rgba(86,99,78,0.24)' : 'none',
        borderBottom: isActiveDonor ? '1px solid rgba(86,99,78,0.24)' : '1px solid rgba(96,73,45,0.11)',
        boxShadow: isActiveDonor ? '0 14px 34px rgba(86,99,78,0.08)' : 'none',
      }}
    >
      <div className="row-accent" />
      <div style={{ width: 26, textAlign: 'center', flexShrink: 0 }}>
        <span className="sans" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(58,50,41,0.44)', fontVariantNumeric: 'lining-nums tabular-nums' }}>{String(donor.rank).padStart(2, '0')}</span>
      </div>
      <Avatar donor={donor} size={42} ring="plain" initialsColor="#4a3b27" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div className="serif" style={{
            fontSize: 19, fontWeight: 600, lineHeight: 1.1, color: '#302b26',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{fullName(donor)}</div>
          {isActiveDonor && <RowYouBadge />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
          <span className="sans" style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
            color: 'rgba(58,50,41,0.48)',
          }}>{donor.badge}</span>
          <DeltaChip delta={donor.delta} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="sans" style={{
          fontSize: 17, fontWeight: 800, color: '#7c5f30',
          letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums',
        }}>
          <AnimatedNumber value={donor.amount} animate={animate} />
        </div>
      </div>
      <button className="row-share" onClick={(e) => { e.stopPropagation(); onShare(donor); }} aria-label="Share rank">
        <ShareGlyph size={15} color="rgba(86,99,78,0.86)" />
      </button>
    </div>
  );
}

function LeaderList({ rows, animate, onShare, activeDonorId }) {
  const refs = useRef({});
  const prev = useRef({});
  const lastSig = useRef(null);
  const sig = rows.map(r => r.id).join('|');

  useLayoutEffect(() => {
    const els = refs.current;
    // clear any leftover transforms so we read true natural positions
    Object.values(els).forEach(el => { if (el) { el.style.transition = 'none'; el.style.transform = ''; } });
    const now = {};
    Object.entries(els).forEach(([id, el]) => { if (el) now[id] = el.getBoundingClientRect().top; });

    const orderChanged = lastSig.current !== null && sig !== lastSig.current;
    if (animate && orderChanged) {
      Object.entries(now).forEach(([id, top]) => {
        const was = prev.current[id];
        if (was != null && Math.abs(was - top) > 0.5) {
          const el = els[id];
          const dy = was - top;
          el.style.transition = 'none';
          el.style.transform = `translateY(${dy}px)`;
          el.style.zIndex = dy < 0 ? '5' : '1';
          el.getBoundingClientRect(); // force reflow so the transition registers
          requestAnimationFrame(() => {
            el.style.transition = 'transform 640ms cubic-bezier(.22,1,.36,1)';
            el.style.transform = '';
          });
          const clear = () => { el.style.zIndex = ''; el.style.transition = ''; el.removeEventListener('transitionend', clear); };
          el.addEventListener('transitionend', clear);
        }
      });
    }
    prev.current = now;
    lastSig.current = sig;
  }, [sig, animate]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 0, padding: '0 0 8px',
      borderTop: '1px solid rgba(96,73,45,0.13)',
    }}>
      {rows.map(d => (
        <div key={d.id} ref={el => { refs.current[d.id] = el; }} style={{ position: 'relative' }}>
          <LeaderRow donor={d} animate={animate} onShare={onShare} activeDonorId={activeDonorId} />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { LeaderRow, LeaderList, RowYouBadge });
