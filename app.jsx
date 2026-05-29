// ─────────────────────────────────────────────────────────────
// Crowned — main app
// ─────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "orgName": "Crowned",
  "serifFont": "Cormorant Garamond",
  "goldIntensity": 62,
  "bgDarkness": 72,
  "animations": true,
  "accent": "#f5c84b"
}/*EDITMODE-END*/;

const SERIF_OPTS = ['Cormorant Garamond', 'Playfair Display', 'Marcellus'];

function mix(a, b, t) {
  const pa = a.match(/\w\w/g).map(h => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map(h => parseInt(h, 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// ---- animated tab switch ----
function TabSwitch({ tab, onChange }) {
  const tabs = [['all', 'All Time'], ['month', 'This Month']];
  const idx = tab === 'month' ? 1 : 0;
  return (
    <div style={{
      position: 'relative', display: 'flex', margin: '0 16px',
      background: 'rgba(255,255,255,0.04)', borderRadius: 100, padding: 4,
      border: '1px solid rgba(245,200,75,0.14)',
    }}>
      <div style={{
        position: 'absolute', top: 4, bottom: 4, left: 4, width: 'calc(50% - 4px)',
        borderRadius: 100, transform: `translateX(${idx * 100}%)`,
        transition: 'transform .42s cubic-bezier(.34,1.4,.5,1)',
        background: 'linear-gradient(135deg, rgba(245,200,75,0.22), rgba(184,134,11,0.16))',
        border: '1px solid rgba(245,200,75,0.4)',
        boxShadow: '0 2px 12px rgba(245,200,75,0.15)',
      }} />
      {tabs.map(([id, label]) => (
        <button key={id} className="tab-btn" onClick={() => onChange(id)} style={{
          color: tab === id ? '#fff3c4' : 'rgba(255,255,255,0.5)',
        }}>{label}</button>
      ))}
    </div>
  );
}

function Header({ orgName, onRefresh, season }) {
  return (
    <div style={{ padding: '0 18px', textAlign: 'center', position: 'relative' }}>
      <button className="icon-btn" onClick={onRefresh} aria-label="Refresh leaderboard" style={{ position: 'absolute', right: 18, top: 2 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 11a8 8 0 10-1.6 5.4M20 5v6h-6" stroke="rgba(245,200,75,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div className="sans" style={{ fontSize: 9.5, letterSpacing: 3.5, textTransform: 'uppercase', color: 'rgba(245,200,75,0.55)', marginBottom: 8 }}>
        Donor Leaderboard
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Crown size={22} />
        <span className="serif gold-solid" style={{ fontSize: 34, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', lineHeight: 1 }}>{orgName}</span>
        <Crown size={22} style={{ transform: 'scaleX(-1)' }} />
      </div>
      <div className="sans" style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', marginTop: 9, letterSpacing: 0.3 }}>
        {season}
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState('all');
  const [share, setShare] = useState(null);
  const [donateOpen, setDonateOpen] = useState(false);
  const [burst, setBurst] = useState(1);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  const anim = !!t.animations;
  const ranked = rankedFor(tab);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const prevLeader = useRef(top3[0] && top3[0].id);

  // confetti when the #1 donor changes (tab switch / refresh)
  useEffect(() => {
    const leader = top3[0] && top3[0].id;
    if (anim && leader && leader !== prevLeader.current) {
      setBurst(b => b + 1);
    }
    prevLeader.current = leader;
  }, [tab]);

  const toast = (msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1900);
  };

  const refresh = () => { if (anim) setBurst(b => b + 1); toast('Leaderboard refreshed'); };

  // ---- tweak-derived style vars ----
  const goldSat = (0.55 + (t.goldIntensity / 100) * 0.95).toFixed(2);
  const goldBri = (0.82 + (t.goldIntensity / 100) * 0.42).toFixed(2);
  const d = t.bgDarkness / 100;
  const bgTop = mix('1a2440', '0a0f1e', d);
  const bgMid = mix('0d1424', '05080f', d);
  const bgBot = mix('080c16', '03050a', d);

  const rootVars = {
    '--serif': `'${t.serifFont}'`,
    '--gold-sat': goldSat,
    '--gold-bri': goldBri,
    '--accent': t.accent,
    height: '100%',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
     <div style={{ position: 'relative' }}>
      <IOSDevice dark width={402} height={874}>
        <div style={{
          ...rootVars, minHeight: '100%', position: 'relative',
          background: `radial-gradient(125% 75% at 50% 0%, ${bgTop} 0%, ${bgMid} 48%, ${bgBot} 100%)`,
        }}>
          {/* ambient particles across whole screen */}
          <GoldParticles count={20} animate={anim} accent={t.accent} />

          {/* sticky header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 30, paddingTop: 56, paddingBottom: 12,
            background: `linear-gradient(${bgTop}, ${bgTop}f2 70%, ${bgTop}00)`,
            backdropFilter: 'blur(2px)',
          }}>
            <Header orgName={t.orgName} onRefresh={refresh} season={tab === 'month' ? 'May 2026 · Live standings' : 'Since inception - 2026'} />
            <div style={{ marginTop: 16 }}>
              <TabSwitch tab={tab} onChange={setTab} />
            </div>
          </div>

          {/* podium */}
          <div style={{ position: 'relative', zIndex: 2, marginTop: 8 }}>
            <Confetti burstKey={burst} animate={anim} origin={{ x: 50, y: 24 }} />
            <Podium top3={top3} animate={anim} onShare={setShare} accent={t.accent} />
          </div>

          {/* divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '34px 22px 14px', position: 'relative', zIndex: 2 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245,200,75,0.3))' }} />
            <span className="sans" style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(245,200,75,0.6)', whiteSpace: 'nowrap' }}>Full Standings</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(245,200,75,0.3), transparent)' }} />
          </div>

          {/* list 4–10 */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <LeaderList rows={rest} animate={anim} onShare={setShare} />
          </div>

          {/* footer */}
          <div style={{ textAlign: 'center', padding: '14px 24px 120px', position: 'relative', zIndex: 2 }}>
            <div className="sans" style={{ fontSize: 11, color: 'rgba(255,255,255,0.34)', lineHeight: 1.6 }}>
              Every gift writes the legacy.<br />Tap any patron to share their place.
            </div>
          </div>

          {/* share modal */}
          {share && (
            <ShareModal donor={share} orgName={t.orgName} animate={anim} onClose={() => setShare(null)} toast={toast} />
          )}

          {/* donate modal */}
          {donateOpen && (
            <DonateModal orgName={t.orgName} animate={anim} onClose={() => setDonateOpen(false)} toast={toast} />
          )}

          {/* toast */}
          {toastMsg && <div className="toast">{toastMsg}</div>}
        </div>
      </IOSDevice>

      {/* floating donate CTA — pinned to the device frame, not the scroll area */}
      {!share && !donateOpen && <DonateButton onClick={() => setDonateOpen(true)} />}
     </div>

      {/* ---- Tweaks ---- */}
      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakText label="Organization" value={t.orgName} onChange={(v) => setTweak('orgName', v)} />
        <TweakColor label="Accent glow" value={t.accent}
          options={['#f5c84b', '#e8d7a8', '#e6a9b0', '#a9d6e6', '#9fd9b4']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Typography" />
        <TweakSelect label="Name serif" value={t.serifFont} options={SERIF_OPTS} onChange={(v) => setTweak('serifFont', v)} />
        <TweakSection label="Finish" />
        <TweakSlider label="Gold intensity" value={t.goldIntensity} min={0} max={100} unit="%" onChange={(v) => setTweak('goldIntensity', v)} />
        <TweakSlider label="Background darkness" value={t.bgDarkness} min={0} max={100} unit="%" onChange={(v) => setTweak('bgDarkness', v)} />
        <TweakSection label="Motion" />
        <TweakToggle label="Animations" value={t.animations} onChange={(v) => setTweak('animations', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
