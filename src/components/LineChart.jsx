'use client';

import { useMemo, useRef, useState } from 'react';

// Lightweight responsive SVG line chart with crosshair tooltip.
// series: [{ key, label, color }], data: [{ x: label, [key]: number }]
// Validated categorical pair (light surface): #4f46e5 / #0d9488.
export default function LineChart({ data, series, height = 220, area = true, formatX = (x) => x, showXEvery = 1, ariaLabel }) {
  const W = 640;
  const H = height;
  const pad = { t: 16, r: series.length > 1 ? 72 : 16, b: 28, l: 40 };
  const ref = useRef(null);
  const [hover, setHover] = useState(null);

  const { max, ticks } = useMemo(() => {
    const m = Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key] || 0)));
    const step = Math.pow(10, Math.floor(Math.log10(m))) / (m / Math.pow(10, Math.floor(Math.log10(m))) < 3 ? 2 : 1);
    const top = Math.ceil(m / step) * step;
    return { max: top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
  }, [data, series]);

  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => pad.t + ih - (v / max) * ih;

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - pad.l) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div className="linechart" style={{ position: 'relative' }}>
      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>
          ))}
        </div>
      )}
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={pad.l - 8} y={y(t) + 4} className="axis" textAnchor="end">{t}</text>
          </g>
        ))}
        {data.map((d, i) =>
          i % showXEvery === 0 || i === data.length - 1 ? (
            <text key={i} x={x(i)} y={H - 8} className="axis" textAnchor="middle">{formatX(d.x)}</text>
          ) : null
        )}
        {series.map((s, si) => {
          const pts = data.map((d, i) => `${x(i)},${y(d[s.key] || 0)}`).join(' ');
          return (
            <g key={s.key}>
              {area && si === 0 && (
                <polygon points={`${x(0)},${y(0)} ${pts} ${x(data.length - 1)},${y(0)}`} fill={s.color} opacity="0.08" />
              )}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {series.length > 1 && data.length > 0 && (
                <text x={x(data.length - 1) + 8} y={y(data[data.length - 1][s.key] || 0) + 4} className="direct-label">
                  {s.label}
                </text>
              )}
            </g>
          );
        })}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} className="crosshair" />
            {series.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(data[hover][s.key] || 0)} r="4.5" fill={s.color} stroke="#fff" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="chart-tooltip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <div className="tt-title">{formatX(data[hover].x, true)}</div>
          {series.map((s) => (
            <div key={s.key} className="tt-row">
              <i style={{ background: s.color }} />
              <span>{s.label}</span>
              <b>{data[hover][s.key] || 0}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
