// ─────────────────────────────────────────────────────────────
// Crowned — visual effects + atoms
// Avatar, AnimatedNumber, LightRays, GoldParticles, Confetti, Crown
// ─────────────────────────────────────────────────────────────
const { useState, useEffect, useRef, useLayoutEffect } = React;

// ---- Crown glyph (simple geometric, gold-fillable) ----
function Crown({ size = 28, className = 'gold-fill', style = {} }) {
  return (
    <span className={className} style={{
      display: 'inline-block', width: size, height: size * 0.82,
      WebkitMaskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(crownSvg())}")`,
      maskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(crownSvg())}")`,
      WebkitMaskSize: 'contain', maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center', maskPosition: 'center',
      ...style,
    }} />
  );
}
function crownSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 82"><path d="M6 26l16 14 22-32 22 32 16-14 -8 50H14z"/><rect x="12" y="78" width="76" height="4" rx="2"/><circle cx="6" cy="22" r="6"/><circle cx="50" cy="6" r="6"/><circle cx="94" cy="22" r="6"/></svg>`;
}

// ---- Avatar: textured placeholder + initials + metallic ring ----
const RING = {
  gold:     'linear-gradient(135deg, #c9b37d, #fff8e6 48%, #8b6b34)',
  platinum: 'linear-gradient(135deg, #b9c5c8, #ffffff 48%, #7f8b8e)',
  bronze:   'linear-gradient(135deg, #d5b7a5, #fff1e7 48%, #a88973)',
  plain:    'linear-gradient(135deg, #d9d2c5, #fdf8ef)',
};
function Avatar({ donor, size = 56, ring = 'plain', initialsColor }) {
  const pad = Math.max(2, Math.round(size * 0.045));
  const inner = size - pad * 2;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: RING[ring], padding: pad, boxSizing: 'border-box',
      boxShadow: ring === 'plain' ? 'none' : '0 10px 24px rgba(84,65,42,0.14)',
    }}>
      <div style={{
        width: inner, height: inner, borderRadius: '50%', overflow: 'hidden',
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(120% 120% at 30% 20%, hsl(${donor.hue} 26% 82%), hsl(${donor.hue} 24% 66%))`,
        boxShadow: 'inset 0 0 0 1.5px rgba(96,73,45,0.14)',
      }}>
        {/* photo placeholder stripes */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.16,
          backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 9px)',
        }} />
        <span className="serif" style={{
          position: 'relative', fontSize: inner * 0.4, fontWeight: 600,
          color: initialsColor || '#4a3b27', letterSpacing: 0.5,
        }}>{initials(donor)}</span>
      </div>
    </div>
  );
}

// ---- Count-up number ----
function AnimatedNumber({ value, animate = true, prefix = '$', className, style }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!animate) { setDisplay(value); fromRef.current = value; return; }
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const dur = 900; const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * e));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, animate]);
  return <span className={className} style={style}>{prefix}{Math.round(display).toLocaleString('en-US')}</span>;
}

// ---- Ambient light rays behind podium ----
function LightRays({ animate = true, accent = '#f5c84b' }) {
  return (
    <div aria-hidden style={{
      position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
      width: 520, height: 520, pointerEvents: 'none', zIndex: 0,
      maskImage: 'radial-gradient(closest-side, #000 0%, #000 35%, transparent 72%)',
      WebkitMaskImage: 'radial-gradient(closest-side, #000 0%, #000 35%, transparent 72%)',
    }}>
      <div className={animate ? 'rays-spin' : ''} style={{
        position: 'absolute', inset: 0,
        background: `repeating-conic-gradient(from 0deg at 50% 50%, ${accent}22 0deg 5deg, transparent 5deg 16deg)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(closest-side, ${accent}38, transparent 60%)`,
      }} />
    </div>
  );
}

// ---- Floating gold particles ----
function GoldParticles({ count = 22, animate = true, accent = '#f5c84b' }) {
  const pieces = useRef(null);
  if (!pieces.current) {
    pieces.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 1.5 + Math.random() * 2.8,
      delay: -Math.random() * 14,
      dur: 9 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 40,
      op: 0.25 + Math.random() * 0.5,
    }));
  }
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {pieces.current.map(p => (
        <span key={p.id} className={animate ? 'particle-rise' : ''} style={{
          position: 'absolute', bottom: -10, left: p.left + '%',
          width: p.size, height: p.size, borderRadius: '50%',
          background: `radial-gradient(circle, #fff8e0, ${accent} 60%, transparent)`,
          opacity: animate ? p.op : p.op * 0.6,
          '--drift': p.drift + 'px',
          animationDelay: p.delay + 's',
          animationDuration: p.dur + 's',
        }} />
      ))}
    </div>
  );
}

// ---- Confetti / gold burst ----
function Confetti({ burstKey, animate = true, origin = { x: 50, y: 30 } }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!burstKey || !animate) return;
    const colors = ['#f5c84b', '#fff3c4', '#b8860b', '#d8dee6', '#ffffff', '#c98a4b'];
    const next = Array.from({ length: 46 }, (_, i) => {
      const ang = (Math.PI * 2 * i) / 46 + Math.random() * 0.5;
      const dist = 70 + Math.random() * 150;
      return {
        id: burstKey + '-' + i,
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist - 40 - Math.random() * 60,
        rot: (Math.random() - 0.5) * 720,
        w: 4 + Math.random() * 6,
        h: 7 + Math.random() * 12,
        color: colors[i % colors.length],
        dur: 1100 + Math.random() * 900,
        round: Math.random() > 0.6,
      };
    });
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 2100);
    return () => clearTimeout(t);
  }, [burstKey, animate]);
  if (!pieces.length) return null;
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, overflow: 'hidden' }}>
      {pieces.map(p => (
        <span key={p.id} className="confetti-piece" style={{
          position: 'absolute', left: origin.x + '%', top: origin.y + '%',
          width: p.w, height: p.h, background: p.color,
          borderRadius: p.round ? '50%' : 1,
          '--dx': p.dx + 'px', '--dy': p.dy + 'px', '--rot': p.rot + 'deg',
          animationDuration: p.dur + 'ms',
        }} />
      ))}
    </div>
  );
}

Object.assign(window, { Crown, Avatar, AnimatedNumber, LightRays, GoldParticles, Confetti });
