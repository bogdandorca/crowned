// ─────────────────────────────────────────────────────────────
// Crowned — main app
// ─────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "orgName": "Crowned",
  "serifFont": "Cormorant Garamond",
  "goldIntensity": 22,
  "bgDarkness": 18,
  "animations": true,
  "accent": "#6f7f68"
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
      position: 'relative', display: 'flex', margin: '0 auto', maxWidth: 360,
      background: 'rgba(255,255,255,0.52)', borderRadius: 100, padding: 4,
      border: '1px solid rgba(96,73,45,0.14)',
      boxShadow: '0 12px 32px rgba(84,65,42,0.08)',
    }}>
      <div style={{
        position: 'absolute', top: 4, bottom: 4, left: 4, width: 'calc(50% - 4px)',
        borderRadius: 100, transform: `translateX(${idx * 100}%)`,
        transition: 'transform .32s cubic-bezier(.22,1,.36,1)',
        background: '#fffaf1',
        border: '1px solid rgba(96,73,45,0.16)',
      }} />
      {tabs.map(([id, label]) => (
        <button key={id} className="tab-btn" onClick={() => onChange(id)} style={{
          color: tab === id ? '#3a3229' : 'rgba(58,50,41,0.48)',
        }}>{label}</button>
      ))}
    </div>
  );
}

function Header({ orgName, onRefresh, season }) {
  return (
    <div style={{ padding: '0 18px', position: 'relative' }}>
      <button className="icon-btn" onClick={onRefresh} aria-label="Refresh leaderboard" style={{ position: 'absolute', right: 18, top: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 11a8 8 0 10-1.6 5.4M20 5v6h-6" stroke="rgba(86,99,78,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 34, height: 34, borderRadius: '50%', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(96,73,45,0.28)', background: 'rgba(255,250,241,0.58)',
          color: '#695126', fontFamily: 'Georgia, serif', fontWeight: 700,
        }}>C</span>
        <span className="sans" style={{ fontSize: 10, letterSpacing: 3.2, textTransform: 'uppercase', color: 'rgba(58,50,41,0.56)' }}>
          Donor Leaderboard
        </span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <span className="serif site-wordmark" style={{ fontSize: 54, fontWeight: 600, letterSpacing: 0, lineHeight: 0.92, color: '#2f2a25' }}>{orgName}</span>
      </div>
      <div className="sans" style={{ fontSize: 12, color: 'rgba(58,50,41,0.5)', marginTop: 12, letterSpacing: 0.3, textAlign: 'center' }}>
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
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  const anim = !!t.animations;
  const ranked = rankedFor(tab);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  const toast = (msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1900);
  };

  const refresh = () => { toast('Leaderboard refreshed'); };

  // ---- tweak-derived style vars ----
  const goldSat = (0.38 + (t.goldIntensity / 100) * 0.55).toFixed(2);
  const goldBri = (0.92 + (t.goldIntensity / 100) * 0.16).toFixed(2);
  const pastelSurface = '#fbf7f0';
  const blushWash = '#ead8df';
  const sageInk = '#56634e';
  const porcelainBlue = '#e6edf0';
  const champagne = '#8b6b34';

  const rootVars = {
    '--serif': `'${t.serifFont}'`,
    '--gold-sat': goldSat,
    '--gold-bri': goldBri,
    '--accent': sageInk,
    '--pastel-surface': pastelSurface,
    '--blush-wash': blushWash,
    '--sage-ink': sageInk,
    '--porcelain-blue': porcelainBlue,
    '--champagne': champagne,
    height: '100%',
  };
  const pageGutter = 'clamp(24px, 6vw, 104px)';
  const headerBleed = `calc(-1 * ${pageGutter})`;

  return (
    <div style={{
      ...rootVars, minHeight: '100vh', width: '100%', position: 'relative', overflowX: 'hidden',
      color: '#2f2a25',
      background: `
        radial-gradient(80% 56% at 18% 0%, ${blushWash}b8 0%, transparent 62%),
        radial-gradient(72% 48% at 92% 8%, ${porcelainBlue}d8 0%, transparent 60%),
        linear-gradient(145deg, ${pastelSurface} 0%, #f3ebdf 50%, #e9eef0 100%)
      `,
    }}>
      <main style={{ width: '100%', margin: 0, paddingLeft: pageGutter, paddingRight: pageGutter }}>
          {/* sticky header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 30, paddingTop: 30, paddingBottom: 14,
            marginLeft: headerBleed,
            marginRight: headerBleed,
            paddingLeft: pageGutter,
            paddingRight: pageGutter,
            background: 'linear-gradient(rgba(251,247,240,0.88), rgba(251,247,240,0.68) 78%, rgba(251,247,240,0))',
            backdropFilter: 'blur(10px)',
          }}>
            <div className="site-header-inner" style={{ width: '100%', maxWidth: 1120, margin: '0 auto' }}>
              <Header orgName={t.orgName} onRefresh={refresh} season={tab === 'month' ? 'May 2026 · Live standings' : 'Since inception - 2026'} />
              <div style={{ marginTop: 16 }}>
                <TabSwitch tab={tab} onChange={setTab} />
              </div>
            </div>
          </div>

          {/* podium */}
          <div style={{ position: 'relative', zIndex: 2, marginTop: 28 }}>
            <Podium top3={top3} animate={anim} onShare={setShare} accent={t.accent} />
          </div>

          {/* divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '42px 0 16px', position: 'relative', zIndex: 2 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(96,73,45,0.18))' }} />
            <span className="sans" style={{ fontSize: 10, letterSpacing: 2.8, textTransform: 'uppercase', color: 'rgba(58,50,41,0.5)', whiteSpace: 'nowrap' }}>Full Standings</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(96,73,45,0.18), transparent)' }} />
          </div>

          {/* list 4–10 */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <LeaderList rows={rest} animate={anim} onShare={setShare} />
          </div>

          {/* footer */}
          <div style={{ textAlign: 'center', padding: '14px 24px 120px', position: 'relative', zIndex: 2 }}>
            <div className="sans" style={{ fontSize: 12, color: 'rgba(58,50,41,0.48)', lineHeight: 1.6 }}>
              Every gift writes the legacy.<br />Tap any patron to share their place.
            </div>
          </div>
      </main>

          {/* share modal */}
          {share && (
            <ShareModal donor={share} orgName={t.orgName} animate={anim} onClose={() => setShare(null)} toast={toast} />
          )}

          {/* donate modal */}
          {donateOpen && (
            <DonateModal orgName={t.orgName} tab={tab} animate={anim} onClose={() => setDonateOpen(false)} toast={toast} />
          )}

          {/* toast */}
          {toastMsg && <div className="toast">{toastMsg}</div>}

      {/* floating donate CTA */}
      {!share && !donateOpen && <DonateButton onClick={() => setDonateOpen(true)} />}

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
