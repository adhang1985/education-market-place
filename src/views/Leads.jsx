'use client';

import { useEffect, useState } from 'react';
import { useSearchParamsState } from '@/lib/useSearchParamsState';
import { getToken } from '@/lib/api';
import { api } from '@/lib/api';
import { LeadCard } from '@/components/Cards';
import { Empty, Spinner } from '@/components/ui';

// initialData is the anonymous, server-rendered list for initialCategory. Logged-in teachers refetch so
// their "Unlocked" badges show; everyone refetches when switching category.
export function LeadsBoard({ compact = false, initialData = null, initialCategory = 'all', initialCats = [] }) {
  const [sp, setSp] = useSearchParamsState();
  const [cats, setCats] = useState(initialCats.filter((x) => x.slug !== 'other'));
  const [data, setData] = useState(initialData);
  const category = sp.get('category') || 'all';

  useEffect(() => {
    if (!initialCats.length) api('/categories').then((c) => setCats(c.filter((x) => x.slug !== 'other'))).catch(() => {});
  }, [initialCats.length]);
  useEffect(() => {
    if (initialData && category === initialCategory && !getToken()) return setData(initialData);
    setData(null);
    api('/leads', { params: { category, limit: 50 } }).then(setData).catch(() => setData({ items: [] }));
  }, [category]);

  return (
    <>
      <div className={`chips ${compact ? '' : 'mt-m'}`}>
        <button className={`chip ${category === 'all' ? 'active' : ''}`} onClick={() => setSp({})}>All leads</button>
        {cats.map((c) => (
          <button key={c.slug} className={`chip ${category === c.slug ? 'active' : ''}`} onClick={() => setSp({ category: c.slug })}>
            {c.short}{c.leads ? ` · ${c.leads}` : ''}
          </button>
        ))}
      </div>
      {!data ? <Spinner /> : data.items.length === 0 ? (
        <Empty title="No open requests in this category yet" icon="leads" />
      ) : (
        <div className="grid-2 gap-m mt-m">{data.items.map((l) => <LeadCard key={l.id} lead={l} />)}</div>
      )}
    </>
  );
}

export default function Leads(props) {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Lead marketplace</span>
          <h1>Recent learning requests</h1>
          <p className="muted lead">Preview what students need – goal, budget, schedule and area – before using a contact unlock.</p>
        </div>
      </section>
      <div className="container page">
        <LeadsBoard compact {...props} />
      </div>
    </>
  );
}
