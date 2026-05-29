// ─────────────────────────────────────────────────────────────
// Crowned — list rows (#4–10) with FLIP reshuffle
// ─────────────────────────────────────────────────────────────

function LeaderRow({ donor, animate, onShare }) {
  return (
    <div
      className="leader-row"
      onClick={() => onShare(donor)}
      role="button"
      style={{
        display: 'flex', alignItems: 'center', gap: 13,
        padding: '12px 14px 12px 13px', position: 'relative', cursor: 'pointer',
        background: 'linear-gradient(100deg, rgba(245,200,75,0.05), rgba(255,255,255,0.012) 40%)',
        borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)',
        borderLeft: '3px solid transparent',
      }}
    >
      <div className="row-accent" />
      <div style={{ width: 26, textAlign: 'center', flexShrink: 0 }}>
        <span className="serif" style={{ fontSize: 20, fontWeight: 600, color: 'rgba(245,200,75,0.85)', fontVariantNumeric: 'lining-nums tabular-nums' }}>{donor.rank}</span>
      </div>
      <Avatar donor={donor} size={42} ring="plain" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="serif soft-name" style={{
          fontSize: 16.5, fontWeight: 600, lineHeight: 1.1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{fullName(donor)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
          <span className="sans" style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
            color: 'rgba(245,200,75,0.7)',
          }}>{donor.badge}</span>
          <DeltaChip delta={donor.delta} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="sans" style={{
          fontSize: 17, fontWeight: 800, color: 'rgba(255,255,255,0.94)',
          letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums',
        }}>
          <AnimatedNumber value={donor.amount} animate={animate} />
        </div>
      </div>
      <button className="row-share" onClick={(e) => { e.stopPropagation(); onShare(donor); }} aria-label="Share rank">
        <ShareGlyph size={15} color="rgba(245,200,75,0.85)" />
      </button>
    </div>
  );
}

function LeaderList({ rows, animate, onShare }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 14px 8px' }}>
      {rows.map(d => (
        <div key={d.id} ref={el => { refs.current[d.id] = el; }} style={{ position: 'relative' }}>
          <LeaderRow donor={d} animate={animate} onShare={onShare} />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { LeaderRow, LeaderList });
