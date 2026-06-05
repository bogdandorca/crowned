// Crowned - shared active UI atoms
const { useState, useEffect, useRef, useLayoutEffect } = React;

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

Object.assign(window, { Avatar, AnimatedNumber });
