'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const AVATAR_COLORS = ['#6366f1', '#0d9488', '#db2777', '#ea580c', '#2563eb', '#7c3aed', '#059669', '#b45309'];

export function Avatar({ name = '?', src, size = 56 }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const color = AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  if (src) return <img className="avatar" src={src} alt={name} style={{ width: size, height: size }} />;
  return (
    <div className="avatar" style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${color}cc)`, fontSize: size * 0.36 }} aria-label={name}>
      {initials}
    </div>
  );
}

export function Rating({ value, count }) {
  return (
    <span className="rating">
      <Icon name="star" size={15} fill="#f59e0b" className="star" strokeWidth={0} />
      <b>{value?.toFixed ? value.toFixed(1) : value}</b>
      {count !== undefined && <span className="muted"> ({count} reviews)</span>}
    </span>
  );
}

export function FavoriteButton({ teacherId }) {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const active = user?.favorites?.some((f) => f === teacherId);
  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return router.push('/login');
    setBusy(true);
    try {
      const { favorites } = await api(`/teachers/${teacherId}/favorite`, { method: 'POST' });
      setUser({ ...user, favorites });
    } finally {
      setBusy(false);
    }
  };
  return (
    <button className={`icon-btn fav ${active ? 'active' : ''}`} onClick={toggle} disabled={busy} aria-label={active ? 'Remove from saved' : 'Save teacher'}>
      <Icon name="heart" size={20} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}

export function Badge({ tone = 'gray', children, icon }) {
  return (
    <span className={`badge badge-${tone}`}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

export function Alert({ tone = 'error', children }) {
  if (!children) return null;
  return <div className={`alert alert-${tone}`}>{children}</div>;
}

export function Spinner({ label = 'Loading…' }) {
  return <div className="spinner-wrap"><div className="spinner" />{label}</div>;
}

export function Empty({ title, children, icon = 'search' }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={26} /></div>
      <h3>{title}</h3>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

export function StatCard({ icon, tone = 'violet', value, label, sub, change }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon tone-${tone}`}><Icon name={icon} size={22} /></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {change !== undefined && change !== null && (
        <div className={`stat-change ${change < 0 ? 'down' : 'up'}`}>{change >= 0 ? '+' : ''}{change}%</div>
      )}
    </div>
  );
}
