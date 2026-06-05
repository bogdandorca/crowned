// ─────────────────────────────────────────────────────────────
// Crowned — Share flow (modal + 9:16 / 1:1 shareable card)
// ─────────────────────────────────────────────────────────────

function ShareCardArt({ donor, orgName, format }) {
  const base = format === 'story' ? { w: 360, h: 640 } : { w: 400, h: 400 };
  const m = MEDAL[donor.rank] || { ring: 'plain', tone: '#f5c84b' };
  const top = donor.rank <= 3;
  const av = format === 'story' ? 132 : 104;
  return (
    <div style={{
      width: base.w, height: base.h, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(90% 60% at 18% 0%, rgba(234,216,223,0.82), transparent 62%), radial-gradient(80% 54% at 90% 10%, rgba(230,237,240,0.9), transparent 60%), linear-gradient(145deg, #fbf7f0, #f1e8dc 54%, #e8edf0)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: format === 'story' ? '46px 30px 38px' : '30px 28px',
    }}>
      {/* wordmark */}
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(96,73,45,0.28)', background: 'rgba(255,250,241,0.58)',
            color: '#695126', fontFamily: 'Georgia, serif', fontWeight: 700,
          }}>C</span>
          <span className="serif" style={{ fontSize: 22, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: '#302b26' }}>{orgName}</span>
        </div>
        <div style={{ width: 50, height: 1, background: 'linear-gradient(90deg,transparent,rgba(96,73,45,0.28),transparent)' }} />
      </div>

      {/* hero */}
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: format === 'story' ? '0 1 auto' : 'none', margin: format === 'square' ? '4px 0' : 0 }}>
        <div style={{ position: 'relative' }}>
          <div aria-hidden style={{ position: 'absolute', inset: -18, borderRadius: '50%', background: `radial-gradient(circle, ${m.tone}22, transparent 68%)` }} />
          <div style={{ position: 'relative' }}>
            <Avatar donor={donor} size={av} ring={m.ring} initialsColor="#4a3b27" />
            {top && <MedalBadge rank={donor.rank} />}
          </div>
        </div>
        <div className="serif" style={{ marginTop: 22, fontSize: format === 'story' ? 30 : 26, fontWeight: 600, textAlign: 'center', lineHeight: 1.05, color: '#302b26' }}>
          {fullName(donor)}
        </div>
        <div className="sans" style={{ marginTop: 12, fontSize: format === 'story' ? 44 : 38, fontWeight: 800, letterSpacing: 0, fontVariantNumeric: 'tabular-nums', color: '#7c5f30' }}>
          {fmtMoney(donor.amount)}
        </div>
      </div>

      {/* tagline */}
      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center' }}>
        <div className="sans" style={{ fontSize: format === 'story' ? 13.5 : 13, lineHeight: 1.5, color: 'rgba(58,50,41,0.68)', maxWidth: format === 'story' ? 320 : 300 }}>
          I'm <span style={{ fontWeight: 800, color: '#7c5f30' }}>#{donor.rank}</span> on the <span style={{ fontWeight: 700 }}>{orgName}</span> leaderboard
        </div>
        <div className="sans" style={{ marginTop: 10, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(58,50,41,0.48)' }}>
          Every gift writes the legacy
        </div>
      </div>
    </div>
  );
}

function ShareModal({ donor, orgName, animate, onClose, toast }) {
  const [format, setFormat] = useState('story');
  const boxRef = useRef(null);
  const [scale, setScale] = useState(1);
  const base = format === 'story' ? { w: 360, h: 640 } : { w: 400, h: 400 };

  useLayoutEffect(() => {
    const fit = () => {
      const el = boxRef.current;
      if (!el) return;
      const aw = el.clientWidth - 8, ah = el.clientHeight - 8;
      setScale(Math.min(aw / base.w, ah / base.h));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [format]);

  const channels = [
    { id: 'ig', label: 'Instagram', glyph: <IGGlyph />, bg: 'linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)' },
    { id: 'fb', label: 'Facebook', glyph: <FBGlyph />, bg: '#1877F2' },
  ];

  return (
    <div className={animate ? 'sheet-in' : ''} style={{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'rgba(251,247,240,0.88)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      display: 'flex', flexDirection: 'column',
      width: 'min(100%, 860px)', margin: '0 auto',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 18px 8px' }}>
        <span className="serif" style={{ fontSize: 25, fontWeight: 600, whiteSpace: 'nowrap', color: '#302b26' }}>Share My Rank</span>
        <button onClick={onClose} className="icon-btn" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 2l12 12M14 2L2 14" stroke="rgba(58,50,41,0.66)" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* format toggle */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 18px 4px', justifyContent: 'center' }}>
        {[['story', 'Story · 9:16'], ['square', 'Feed · 1:1']].map(([id, lbl]) => (
          <button key={id} onClick={() => setFormat(id)} className="fmt-tab" data-on={format === id}>
            {lbl}
          </button>
        ))}
      </div>

      {/* preview */}
      <div ref={boxRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 18px', minHeight: 0 }}>
        <div style={{ width: base.w * scale, height: base.h * scale, position: 'relative' }}>
          <div style={{
            width: base.w, height: base.h, transform: `scale(${scale})`, transformOrigin: 'top left',
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(84,65,42,0.18), 0 0 0 1px rgba(96,73,45,0.16)',
          }}>
            <ShareCardArt donor={donor} orgName={orgName} format={format} />
          </div>
        </div>
      </div>

      {/* actions */}
      <div style={{ padding: '8px 18px 30px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {channels.map(c => (
            <button key={c.id} className="share-channel" onClick={() => toast(`Opening ${c.label}…`)} style={{ background: c.bg }}>
              {c.glyph}<span>{c.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="share-secondary" onClick={() => toast('Saved to Photos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="rgba(86,99,78,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Save Image
          </button>
          <button className="share-secondary" onClick={() => toast('Link copied')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 15l6-6M10 6l1-1a4 4 0 016 6l-1 1M14 18l-1 1a4 4 0 01-6-6l1-1" stroke="rgba(86,99,78,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}

function IGGlyph() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.3" fill="#fff"/></svg>;
}
function FBGlyph() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M14 8.5V7c0-.8.2-1.2 1.3-1.2H17V3h-2.6C11.5 3 11 4.7 11 6.6v1.9H9V11h2v10h3v-10h2.2l.3-2.5H14z"/></svg>;
}

Object.assign(window, { ShareModal, ShareCardArt });
