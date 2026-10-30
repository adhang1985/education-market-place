'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParamsState } from '@/lib/useSearchParamsState';
import { api } from '@/lib/api';
import Icon from '@/components/Icon';
import { TeacherRow } from '@/components/Cards';
import { Empty, Spinner } from '@/components/ui';
import { CLASS_OPTIONS, classLabel, inr } from '@/lib/utils';

const MODE_OPTS = [['online', 'Online'], ['home', "At Student's Home"], ['both', 'Both']];
const EXP_OPTS = [['0-1', '0-1 years'], ['2-5', '2-5 years'], ['5-10', '5-10 years'], ['10+', '10+ years']];
const RATING_OPTS = [['4.5', '4.5 & above'], ['4', '4.0 & above'], ['3.5', '3.5 & above']];
const PRICE_MAX = 2000;

const listParam = (sp, k) => (sp.get(k) ? sp.get(k).split(',') : []);

export default function Search({ initialData = null, initialSubjects = [], initialCategories = [] }) {
  const [sp, setSp] = useSearchParamsState();
  const [data, setData] = useState(initialData);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [categories, setCategories] = useState(initialCategories);
  const [q, setQ] = useState(sp.get('q') || '');
  const [loc, setLoc] = useState(sp.get('location') || '');
  const [price, setPrice] = useState(Number(sp.get('maxPrice')) || PRICE_MAX);
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(() => Object.fromEntries(sp.entries()), [sp]);
  // Query string the server already rendered results for – skip the duplicate fetch on first load.
  const renderedQuery = useRef(initialData ? sp.toString() : null);

  useEffect(() => {
    if (!initialSubjects.length) api('/teachers/subjects').then(setSubjects).catch(() => {});
    if (!initialCategories.length) api('/categories').then(setCategories).catch(() => {});
  }, [initialSubjects.length, initialCategories.length]);

  useEffect(() => {
    if (renderedQuery.current === sp.toString()) return;
    renderedQuery.current = null;
    setData(null);
    api('/teachers', { params }).then(setData).catch(() => setData({ items: [], total: 0, facets: null }));
  }, [params, sp]);

  const update = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v === undefined || v === '' || (Array.isArray(v) && !v.length) ? next.delete(k) : next.set(k, Array.isArray(v) ? v.join(',') : v)));
    next.delete('page');
    setSp(next);
  };

  const toggleList = (key, value) => {
    const cur = listParam(sp, key);
    update({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
  };

  const submit = (e) => {
    e.preventDefault();
    update({ q, location: loc });
  };

  const f = data?.facets;
  const page = Number(sp.get('page') || 1);
  // Real links (not buttons) so crawlers can follow pagination.
  const pageHref = (n) => {
    const next = new URLSearchParams(sp);
    if (n > 1) next.set('page', n);
    else next.delete('page');
    const qs = next.toString();
    return `/search${qs ? `?${qs}` : ''}`;
  };
  const activeCategory = categories.find((c) => c.slug === sp.get('category'));

  return (
    <>
    <div className="search-top">
      <div className="container">
      <h1 className="page-title">Find your perfect teacher</h1>
      <p className="muted lead">Compare verified tutors by subject, fees, ratings and teaching mode.</p>
      <form className="searchbar mt-m" onSubmit={submit}>
        <div className="sb-field grow">
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teachers by subject, class or keyword..." />
        </div>
        <div className="sb-field sb-loc">
          <Icon name="pin" />
          <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="City (e.g. Delhi)" />
        </div>
        <button className="btn btn-primary sb-btn"><Icon name="search" size={18} /> Search</button>
      </form>

      <div className="card quick-filters">
        <label>
          <span>Subject</span>
          <select value={sp.get('subject') || ''} onChange={(e) => update({ subject: e.target.value })}>
            <option value="">Select Subject</option>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>
          <span>Class</span>
          <select value={sp.get('studentClass') || ''} onChange={(e) => update({ studentClass: e.target.value })}>
            <option value="">Select Class</option>
            {CLASS_OPTIONS.filter((c) => /^\d+$/.test(c)).map((c) => <option key={c} value={c}>{classLabel(c)}</option>)}
          </select>
        </label>
        <label>
          <span>Category</span>
          <select value={sp.get('category') || ''} onChange={(e) => update({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label>
          <span>Mode</span>
          <select value={sp.get('mode') || ''} onChange={(e) => update({ mode: e.target.value, modes: undefined })}>
            <option value="">Online / Offline</option>
            <option value="online">Online</option>
            <option value="home">At Student's Home</option>
          </select>
        </label>
      </div>
      </div>
    </div>

    <div className="container page">
      <div className="row-between results-head">
        <h2 className="h-results"><b>{data ? data.total : '…'} Teachers</b> found{activeCategory ? ` in ${activeCategory.name}` : ''}</h2>
        <div className="row gap-s">
          <button className="btn btn-outline btn-sm show-mobile" onClick={() => setShowFilters(!showFilters)}>Filters</button>
          <label className="sort">
            Sort by:
            <select value={sp.get('sort') || 'relevance'} onChange={(e) => update({ sort: e.target.value })}>
              <option value="relevance">Relevance</option>
              <option value="rating">Rating</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="experience">Experience</option>
            </select>
          </label>
        </div>
      </div>

      <div className="search-layout">
        <aside className={`card filters ${showFilters ? 'open' : ''}`}>
          <div className="row-between filters-head">
            <b>Filters</b>
            <button className="link" onClick={() => { setQ(''); setLoc(''); setPrice(PRICE_MAX); setSp(new URLSearchParams()); }}>Clear All</button>
          </div>
          <fieldset>
            <legend>Teaching Mode</legend>
            {MODE_OPTS.map(([v, l]) => (
              <label key={v} className="check">
                <input type="checkbox" checked={listParam(sp, 'modes').includes(v)} onChange={() => { toggleList('modes', v); }} />
                {l} {f && <span className="muted">({f.modes[v]})</span>}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Experience</legend>
            {EXP_OPTS.map(([v, l]) => (
              <label key={v} className="check">
                <input type="checkbox" checked={listParam(sp, 'experience').includes(v)} onChange={() => toggleList('experience', v)} />
                {l} {f && <span className="muted">({f.experience[v]})</span>}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Price Range (per hour)</legend>
            <input
              type="range"
              min="100"
              max={PRICE_MAX}
              step="50"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              onMouseUp={() => update({ maxPrice: price < PRICE_MAX ? price : undefined })}
              onTouchEnd={() => update({ maxPrice: price < PRICE_MAX ? price : undefined })}
              onKeyUp={() => update({ maxPrice: price < PRICE_MAX ? price : undefined })}
            />
            <b className="small">{inr(0)} – {inr(price)}{price === PRICE_MAX ? '+' : ''}</b>
          </fieldset>
          <fieldset>
            <legend>Rating</legend>
            {RATING_OPTS.map(([v, l]) => (
              <label key={v} className="check">
                <input type="checkbox" checked={listParam(sp, 'rating').includes(v)} onChange={() => toggleList('rating', v)} />
                <span className="stars">★★</span> {l} {f && <span className="muted">({f.rating[v]})</span>}
              </label>
            ))}
          </fieldset>
        </aside>

        <div className="results">
          {!data ? <Spinner /> : data.items.length === 0 ? (
            <Empty title="No teachers match your filters">Try removing a filter, or post a requirement and let teachers reach you.</Empty>
          ) : (
            <>
              {data.items.map((t) => <TeacherRow key={t.id} t={t} />)}
              {data.pages > 1 && (
                <div className="pager">
                  {page > 1 ? <Link className="btn btn-outline btn-sm" href={pageHref(page - 1)} rel="prev">Previous</Link> : <button className="btn btn-outline btn-sm" disabled>Previous</button>}
                  <span className="muted">Page {page} of {data.pages}</span>
                  {page < data.pages ? <Link className="btn btn-outline btn-sm" href={pageHref(page + 1)} rel="next">Next</Link> : <button className="btn btn-outline btn-sm" disabled>Next</button>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
