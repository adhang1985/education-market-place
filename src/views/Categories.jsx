'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Icon from '@/components/Icon';
import { Spinner } from '@/components/ui';

const FILTERS = [['', 'All categories'], ['online', 'Online'], ['home', 'Offline / In-person']];

export default function Categories({ initialCats = null }) {
  const [cats, setCats] = useState(initialCats);
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!initialCats) api('/categories').then(setCats).catch(() => setCats([]));
  }, [initialCats]);

  const visible = (cats || []).filter((c) => !q || `${c.name} ${c.desc}`.toLowerCase().includes(q.toLowerCase()));
  const link = (slug) => `/search?${new URLSearchParams({ ...(slug !== 'other' && { category: slug }), ...(mode && { mode }) })}`;

  return (
    <>
    <section className="page-hero">
      <div className="container">
      <span className="eyebrow">Categories</span>
      <h1>What do you want to learn?</h1>
      <p className="muted lead">Browse popular categories or search for a specific skill, subject or expert.</p>
      <form className="searchbar single" onSubmit={(e) => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(q)}${mode ? `&mode=${mode}` : ''}`); }}>
        <div className="sb-field grow">
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search music, coding, dance, exam coaching, wellness..." />
        </div>
      </form>
      <div className="chips">
        {FILTERS.map(([v, l]) => (
          <button key={v} className={`chip ${mode === v ? 'active' : ''}`} onClick={() => setMode(v)}>{l}</button>
        ))}
        <input
          className="chip chip-input"
          placeholder="📍 Near me – enter city"
          onKeyDown={(e) => e.key === 'Enter' && e.target.value && router.push(`/search?location=${encodeURIComponent(e.target.value)}&mode=home`)}
        />
      </div>
      </div>
    </section>

    <div className="container page">
      {!cats ? <Spinner /> : (
        <div className="grid-4">
          {visible.map((c) => (
            <Link key={c.slug} href={link(c.slug)} className="card cat-card">
              <div className="row gap-m">
                <div className={`cat-icon tone-${c.tone}`}>{c.icon}</div>
                <h3>{c.name}</h3>
              </div>
              <p className="muted small">{c.desc}</p>
              <div className="row-between cat-foot">
                <span className="link small">
                  {c.slug === 'other' ? 'Explore all' : `${c.teachers.toLocaleString('en-IN')} ${c.slug === 'school' ? 'tutors' : c.slug === 'career' ? 'consultants' : 'mentors'}`}
                </span>
                <Icon name="arrowRight" size={16} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
