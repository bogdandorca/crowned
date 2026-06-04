// ─────────────────────────────────────────────────────────────
// Crowned — Donate button + modal
// ─────────────────────────────────────────────────────────────

function DonateButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Donate"
      style={{
        position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)',
        zIndex: 50, display: 'inline-flex', alignItems: 'center', gap: 9,
        padding: '14px 28px', borderRadius: 100, border: 'none', cursor: 'pointer',
        fontFamily: 'Archivo, sans-serif', fontSize: 13, fontWeight: 800,
        letterSpacing: 1.6, textTransform: 'uppercase', color: '#fffaf1',
        background: '#56634e',
        boxShadow:
          '0 14px 34px rgba(86,99,78,0.22), 0 2px 8px rgba(84,65,42,0.12)',
        transition: 'transform .15s ease, filter .2s ease',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'translateX(-50%) scale(0.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'translateX(-50%)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(-50%)')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s-7-4.5-9.3-9.1C1 8.5 3 4.5 6.8 4.5c2 0 3.6 1.2 4.4 2.6C12 5.7 13.7 4.5 15.7 4.5c3.8 0 5.8 4 4.1 7.4C19 16.5 12 21 12 21z"
              fill="#fffaf1"/>
      </svg>
      Make a Gift
    </button>
  );
}

function PaymentTile({ label, glyph, bg, onClick, dark = true }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minHeight: 56, borderRadius: 14, border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(96,73,45,0.14)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: bg,
        color: dark ? '#fff' : '#1a1206',
        fontFamily: 'Archivo, sans-serif', fontSize: 14, fontWeight: 700,
        transition: 'transform .15s ease, filter .2s ease',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = '')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
    >
      {glyph}
      <span>{label}</span>
    </button>
  );
}

function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M21.6 12.23c0-.74-.07-1.46-.2-2.14H12v4.05h5.39c-.23 1.24-.94 2.29-2 3v2.49h3.23c1.89-1.74 2.98-4.3 2.98-7.4z" fill="#4285F4"/>
      <path d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.49c-.9.6-2.05.96-3.39.96-2.61 0-4.81-1.76-5.6-4.13H3.06v2.58A10 10 0 0012 22z" fill="#34A853"/>
      <path d="M6.4 13.91A6 6 0 016.08 12c0-.66.12-1.31.32-1.91V7.51H3.06A10 10 0 002 12c0 1.61.39 3.14 1.06 4.49l3.34-2.58z" fill="#FBBC04"/>
      <path d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.86-2.86A10 10 0 0012 2 10 10 0 003.06 7.51l3.34 2.58C7.19 7.72 9.39 5.96 12 5.96z" fill="#EA4335"/>
    </svg>
  );
}

function ApplePayGlyph() {
  return (
    <svg width="42" height="18" viewBox="0 0 42 18" fill="#fff">
      <path d="M7.6 2.7c.45-.55.75-1.3.68-2.06-.65.03-1.45.44-1.92.99-.42.48-.79 1.26-.7 1.99.74.06 1.49-.37 1.94-.92zM8.27 4.3c-1.06-.06-1.96.6-2.47.6-.51 0-1.29-.57-2.14-.55-1.1.02-2.12.64-2.69 1.63-1.15 1.99-.3 4.93.82 6.55.55.8 1.2 1.69 2.06 1.66.82-.03 1.14-.53 2.13-.53s1.28.53 2.14.51c.89-.02 1.45-.81 1.99-1.61.63-.92.89-1.81.9-1.86-.02-.01-1.73-.66-1.75-2.62-.02-1.64 1.34-2.42 1.4-2.46-.77-1.13-1.96-1.26-2.39-1.32z"/>
      <text x="14" y="13" fontFamily="-apple-system, system-ui" fontSize="11" fontWeight="600" fill="#fff">Pay</text>
    </svg>
  );
}

function GPayGlyph() {
  return (
    <svg width="48" height="20" viewBox="0 0 48 20">
      <text x="0" y="14" fontFamily="-apple-system, system-ui" fontSize="11" fontWeight="500" fill="#5F6368">G</text>
      <text x="7" y="14" fontFamily="-apple-system, system-ui" fontSize="11" fontWeight="500" fill="#EA4335">o</text>
      <text x="14" y="14" fontFamily="-apple-system, system-ui" fontSize="11" fontWeight="500" fill="#FBBC04">o</text>
      <text x="21" y="14" fontFamily="-apple-system, system-ui" fontSize="11" fontWeight="500" fill="#4285F4">g</text>
      <text x="28" y="14" fontFamily="-apple-system, system-ui" fontSize="11" fontWeight="500" fill="#34A853">l</text>
      <text x="32" y="14" fontFamily="-apple-system, system-ui" fontSize="11" fontWeight="500" fill="#EA4335">e</text>
      <text x="40" y="14" fontFamily="-apple-system, system-ui" fontSize="11" fontWeight="600" fill="#5F6368">Pay</text>
    </svg>
  );
}

function PayPalGlyph() {
  return (
    <svg width="56" height="18" viewBox="0 0 56 18">
      <text x="0" y="14" fontFamily="-apple-system, system-ui" fontSize="13" fontWeight="700" fill="#003087" fontStyle="italic">Pay</text>
      <text x="22" y="14" fontFamily="-apple-system, system-ui" fontSize="13" fontWeight="700" fill="#009cde" fontStyle="italic">Pal</text>
    </svg>
  );
}

function CardGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="rgba(86,99,78,0.9)" strokeWidth="1.8"/>
      <path d="M2.5 9.5h19" stroke="rgba(86,99,78,0.9)" strokeWidth="1.8"/>
      <path d="M6 15h4" stroke="rgba(86,99,78,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function RankProjectionPanel({ projection }) {
  if (!projection) return null;
  const moved = projection.projectedRank < projection.currentRank;
  const title = moved
    ? `You move to No. ${projection.projectedRank}`
    : `You stay at No. ${projection.currentRank}`;
  const detail = moved
    ? `${fmtMoney(projection.projectedTotal)} puts you ahead of ${projection.nextRankLabel}.`
    : projection.remainingToNext > 0
      ? `${fmtMoney(projection.remainingToNext)} more to reach ${projection.nextRankLabel}.`
      : 'You already hold the leading place.';

  return (
    <div style={{
      marginTop: 12, padding: 14, borderRadius: 16,
      background: 'linear-gradient(145deg, rgba(255,250,241,0.74), rgba(230,237,240,0.58))',
      border: '1px solid rgba(96,73,45,0.15)',
      boxShadow: '0 12px 28px rgba(84,65,42,0.08)',
    }}>
      <div className="sans" style={{
        fontSize: 9.5, letterSpacing: 2.1, textTransform: 'uppercase',
        color: 'rgba(58,50,41,0.48)', marginBottom: 10,
      }}>
        Projected rank
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <div className="sans" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4, color: 'rgba(58,50,41,0.44)' }}>Current</div>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: '#302b26' }}>No. {projection.currentRank}</div>
        </div>
        <div>
          <div className="sans" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4, color: 'rgba(58,50,41,0.44)' }}>After gift</div>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: moved ? '#56634e' : '#302b26' }}>No. {projection.projectedRank}</div>
        </div>
      </div>
      <div className="serif" style={{ fontSize: 20, fontWeight: 600, color: '#302b26', lineHeight: 1.15 }}>
        {title}
      </div>
      <div className="sans" style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.45, color: 'rgba(58,50,41,0.62)' }}>
        {detail}
      </div>
    </div>
  );
}

function DonateModal({ orgName, tab = 'all', animate, onClose, toast }) {
  const [amount, setAmount] = useState(50);
  const [customStr, setCustomStr] = useState('');
  const [signedInDonorId, setSignedInDonorId] = useState(null);
  const presets = [25, 50, 100, 250];
  const isCustom = !presets.includes(amount);
  const projection = signedInDonorId
    ? projectedRankForGift({ donorId: signedInDonorId, tab, giftAmount: amount })
    : null;

  const onPickPreset = (p) => {
    setAmount(p);
    setCustomStr('');
  };
  const onCustomChange = (raw) => {
    const cleaned = raw.replace(/[^\d.]/g, '');
    setCustomStr(cleaned);
    const n = parseFloat(cleaned);
    if (!Number.isNaN(n) && n > 0) setAmount(n);
  };

  const handlePay = (label) => {
    toast(`${label} · $${amount} to ${orgName}`);
  };
  const handleGoogle = () => {
    setSignedInDonorId('tudi');
    toast('Signed in with Google as Tudi');
  };

  return (
    <div
      className={animate ? 'sheet-in' : ''}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(251,247,240,0.88)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', flexDirection: 'column',
        width: 'min(100%, 520px)', margin: '0 auto',
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 18px 8px' }}>
        <span className="serif" style={{ fontSize: 25, fontWeight: 600, whiteSpace: 'nowrap', color: '#302b26' }}>
          Make a Gift
        </span>
        <button onClick={onClose} className="icon-btn" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 2l12 12M14 2L2 14" stroke="rgba(58,50,41,0.66)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!signedInDonorId ? (
          <div style={{
            padding: 16, borderRadius: 18,
            background: 'rgba(255,250,241,0.62)',
            border: '1px solid rgba(96,73,45,0.14)',
            boxShadow: '0 18px 42px rgba(84,65,42,0.10)',
          }}>
            <div className="sans" style={{
              fontSize: 9.5, letterSpacing: 2.4, textTransform: 'uppercase',
              color: 'rgba(58,50,41,0.48)', marginBottom: 6,
            }}>
              Sign in first
            </div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, color: '#302b26' }}>
              Let every gift carry your name
            </div>
            <div className="sans" style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.5, color: 'rgba(58,50,41,0.62)' }}>
              Sign in with Google so your donations accumulate under one profile and lift you up the leaderboard. Guest gifts won&apos;t add to your name.
            </div>
            <button
              onClick={handleGoogle}
              style={{
                marginTop: 14, width: '100%', height: 48, borderRadius: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#fff', color: '#1f1f1f', border: 'none',
                fontFamily: 'Archivo, sans-serif', fontSize: 15, fontWeight: 700,
                boxShadow: '0 8px 18px rgba(84,65,42,0.12)', transition: 'transform .15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = '')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              <GoogleG size={20} />
              Continue with Google
            </button>
          </div>
        ) : (
          signedInDonorId && <RankProjectionPanel projection={projection} />
        )}

        {/* divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(96,73,45,0.16))' }} />
          <span className="sans" style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(58,50,41,0.45)' }}>
            Or pay as guest
          </span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(96,73,45,0.16), transparent)' }} />
        </div>

        {/* amount presets */}
        <div>
          <div className="sans" style={{
            fontSize: 9.5, letterSpacing: 2.4, textTransform: 'uppercase',
            color: 'rgba(58,50,41,0.48)', marginBottom: 8,
          }}>
            Amount
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => onPickPreset(p)}
                className="sans"
                style={{
                  flex: 1, height: 44, borderRadius: 12, cursor: 'pointer',
                  fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                  background: amount === p && !isCustom ? '#56634e' : 'rgba(255,250,241,0.62)',
                  color: amount === p && !isCustom ? '#fffaf1' : 'rgba(58,50,41,0.8)',
                  border: amount === p && !isCustom ? 'none' : '1px solid rgba(96,73,45,0.14)',
                  transition: 'all .18s ease',
                }}
              >
                ${p}
              </button>
            ))}
          </div>
          <div style={{
            marginTop: 8, display: 'flex', alignItems: 'center',
            height: 50, borderRadius: 14, padding: '0 14px',
            background: isCustom ? 'rgba(255,250,241,0.78)' : 'rgba(255,250,241,0.54)',
            border: isCustom ? '1px solid rgba(86,99,78,0.48)' : '1px solid rgba(96,73,45,0.14)',
            transition: 'all .18s ease',
          }}>
            <span className="sans" style={{ fontSize: 17, fontWeight: 800, color: 'rgba(58,50,41,0.48)', marginRight: 8 }}>$</span>
            <input
              type="text"
              inputMode="decimal"
              value={customStr}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder="Custom amount"
              className="sans"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#302b26', fontSize: 17, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              }}
            />
            {isCustom && (
              <span className="sans" style={{ fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(86,99,78,0.85)', fontWeight: 700 }}>
                Selected
              </span>
            )}
          </div>
        </div>

        {/* payment options */}
        <div>
          <div className="sans" style={{
            fontSize: 9.5, letterSpacing: 2.4, textTransform: 'uppercase',
            color: 'rgba(58,50,41,0.48)', marginBottom: 8,
          }}>
            Pay with
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <PaymentTile label="" glyph={<ApplePayGlyph />} bg="#000" onClick={() => handlePay('Apple Pay')} />
              <PaymentTile label="" glyph={<GPayGlyph />} bg="#fff" dark={false} onClick={() => handlePay('Google Pay')} />
            </div>
            <PaymentTile label="" glyph={<PayPalGlyph />} bg="#ffc439" dark={false} onClick={() => handlePay('PayPal')} />
            <PaymentTile label="Credit or debit card" glyph={<CardGlyph />} bg="rgba(255,250,241,0.62)" dark={false} onClick={() => handlePay('Card')} />
          </div>
        </div>

        <div className="sans" style={{ textAlign: 'center', fontSize: 10.5, color: 'rgba(58,50,41,0.46)', lineHeight: 1.5, marginTop: 4 }}>
          Secure checkout · 100% of your gift goes to {orgName}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DonateButton, DonateModal });
