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
  const detail = moved
    ? `${fmtMoney(projection.projectedTotal)} projected total.`
    : projection.remainingToNext > 0
      ? `${fmtMoney(projection.remainingToNext)} more to reach ${projection.nextRankLabel}.`
      : 'You already hold the leading place.';
  const rankNumberStyle = {
    fontSize: 42,
    fontWeight: 700,
    lineHeight: 0.9,
    color: '#302b26',
  };

  return (
    <div style={{
      marginTop: 12, padding: 16, borderRadius: 16,
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
        <div style={{
          padding: '12px 10px', borderRadius: 12,
          background: 'rgba(255,250,241,0.48)',
          border: '1px solid rgba(96,73,45,0.11)',
        }}>
          <div className="sans" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4, color: 'rgba(58,50,41,0.44)' }}>Current</div>
          <div className="serif" style={rankNumberStyle}>No. {projection.currentRank}</div>
        </div>
        <div style={{
          padding: '12px 10px', borderRadius: 12,
          background: moved ? 'rgba(86,99,78,0.12)' : 'rgba(255,250,241,0.48)',
          border: moved ? '1px solid rgba(86,99,78,0.24)' : '1px solid rgba(96,73,45,0.11)',
        }}>
          <div className="sans" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4, color: 'rgba(58,50,41,0.44)' }}>After gift</div>
          <div className="serif" style={{ ...rankNumberStyle, color: moved ? '#56634e' : '#302b26' }}>No. {projection.projectedRank}</div>
        </div>
      </div>
      <div className="sans" style={{ marginTop: 10, fontSize: 14, fontWeight: 700, lineHeight: 1.35, color: moved ? '#56634e' : 'rgba(58,50,41,0.68)' }}>
        {detail}
      </div>
    </div>
  );
}

function DonateModal({ orgName, tab = 'all', animate, guestDonorId, signedInDonorId, signedInDonorName, onClose, toast }) {
  const [amount, setAmount] = useState(50);
  const [customStr, setCustomStr] = useState('');
  const [guestDisplayName, setGuestDisplayName] = useState(() => getGuestDonorName());
  const [pendingGuestName, setPendingGuestName] = useState(() => getGuestDonorName());
  const [submittingMethod, setSubmittingMethod] = useState(null);
  const presets = [25, 50, 100, 250];
  const isCustom = !presets.includes(amount);
  const activeDonorId = signedInDonorId || guestDonorId || getOrCreateGuestDonorToken();
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

  const handlePay = async (label) => {
    const guestName = pendingGuestName.trim();
    if (!signedInDonorId && !guestDisplayName && !guestName) {
      toast('Add a name for your first guest gift');
      return;
    }

    const displayName = signedInDonorId ? (signedInDonorName || 'Signed donor') : saveGuestDonorName(guestDisplayName || guestName);
    if (!signedInDonorId) setGuestDisplayName(displayName);
    setSubmittingMethod(label);
    try {
      const checkout = await createDonationCheckout({
        donorId: activeDonorId,
        displayName,
        amount,
        method: label,
      });
      toast('Opening secure checkout');
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      toast(error.message || 'Checkout is not configured');
    } finally {
      setSubmittingMethod(null);
    }
  };
  const handleGoogle = async () => {
    try {
      const signIn = await startGoogleSignIn({ guestDonorId });
      window.location.assign(signIn.redirectUrl);
    } catch (error) {
      toast(error.message || 'Google sign-in is not configured');
    }
  };

  return (
    <div
      className="donate-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(251,247,240,0.88)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(18px, 4vw, 48px)',
      }}
    >
      <div
        className={`donate-modal-panel ${animate ? 'sheet-in' : ''}`}
        style={{
          width: 'min(100%, 520px)',
          maxHeight: 'min(760px, calc(100vh - 64px))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 22,
          background: 'rgba(251,247,240,0.94)',
          border: '1px solid rgba(96,73,45,0.14)',
          boxShadow: '0 32px 80px rgba(84,65,42,0.22)',
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
              }}
              >
                Sign in first
              </div>
              <div className="serif" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, color: '#302b26' }}>
                Let every gift carry your name
              </div>
              <div className="sans" style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.5, color: 'rgba(58,50,41,0.62)' }}>
                Sign in with Google to merge gifts across devices. Guest gifts stay linked to this browser&apos;s donor ID.
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
              {!guestDisplayName && (
                <div style={{ marginTop: 14 }}>
                  <div className="sans" style={{
                    fontSize: 9.5, letterSpacing: 2.1, textTransform: 'uppercase',
                    color: 'rgba(58,50,41,0.48)', marginBottom: 7,
                  }}>
                    Guest donation name
                  </div>
                  <input
                    type="text"
                    value={pendingGuestName}
                    onChange={(e) => setPendingGuestName(e.target.value)}
                    placeholder="Name for this gift"
                    className="sans"
                    style={{
                      width: '100%', height: 48, borderRadius: 12, padding: '0 13px',
                      background: 'rgba(255,250,241,0.76)',
                      border: '1px solid rgba(96,73,45,0.16)', outline: 'none',
                      color: '#302b26', fontSize: 15, fontWeight: 700,
                    }}
                  />
                </div>
              )}
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
            <button
              onClick={() => handlePay('Stripe')}
              className="sans"
              style={{
                width: '100%', minHeight: 56, borderRadius: 14,
                border: '1px solid rgba(86,99,78,0.18)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#56634e',
                color: '#fffaf1',
                fontFamily: 'Archivo, sans-serif', fontSize: 15, fontWeight: 800,
                transition: 'transform .15s ease, filter .2s ease',
                boxShadow: '0 12px 28px rgba(86,99,78,0.18)',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = '')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              <CardGlyph />
              Continue to Stripe
            </button>
            {submittingMethod && (
              <div className="sans" style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: 'rgba(86,99,78,0.78)' }}>
                Preparing {submittingMethod} checkout...
              </div>
            )}
          </div>

          <div className="sans" style={{ textAlign: 'center', fontSize: 10.5, color: 'rgba(58,50,41,0.46)', lineHeight: 1.5, marginTop: 4 }}>
            Secure checkout · 100% of your gift goes to {orgName}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DonateButton, DonateModal });
