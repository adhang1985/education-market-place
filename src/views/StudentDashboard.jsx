'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { TeacherMiniCard } from '@/components/Cards';
import { Badge, Empty, Spinner } from '@/components/ui';
import { budget, MODE_SHORT, timeAgo } from '@/lib/utils';

export function MyRequirements() {
  const [items, setItems] = useState(null);
  useEffect(() => { api('/requirements/mine').then(setItems); }, []);

  const patch = async (id, body) => {
    const r = await api(`/requirements/${id}`, { method: 'PATCH', body });
    setItems(items.map((i) => (i.id === id ? { ...i, ...r, id } : i)));
  };

  return (
    <>
      <div className="row-between dash-head">
        <div><h1>My Requirements</h1><p className="muted">Track your learning requests and how many teachers connected.</p></div>
        <Link href="/post-requirement" className="btn btn-primary">Post a Requirement</Link>
      </div>
      {!items ? <Spinner /> : items.length === 0 ? (
        <Empty title="You haven't posted any requirement yet" icon="leads"><Link href="/post-requirement">Post one</Link> and get matched with teachers.</Empty>
      ) : (
        <div className="stack">
          {items.map((r) => (
            <div key={r.id} className="card req-row">
              <div className="grow">
                <div className="row gap-s wrap">
                  <b>{r.title}</b>
                  <Badge tone={r.status === 'open' ? 'green' : 'gray'}>{r.status === 'open' ? 'Open' : 'Closed'}</Badge>
                  {!r.consent && <Badge tone="orange">Contact sharing off</Badge>}
                </div>
                <div className="muted small">{r.categoryName} • {MODE_SHORT[r.mode]} • {r.location} • {budget(r)} • Posted {timeAgo(r.createdAt)}</div>
                <div className="small mt-s"><b>{r.teachersConnected}</b> teacher{r.teachersConnected === 1 ? '' : 's'} unlocked your contact</div>
              </div>
              <div className="row gap-s wrap">
                {!r.consent && r.status === 'open' && <button className="btn btn-soft btn-sm" onClick={() => patch(r.id, { consent: true })}>Allow teachers to contact me</button>}
                <button className="btn btn-outline btn-sm" onClick={() => patch(r.id, { status: r.status === 'open' ? 'closed' : 'open' })}>
                  {r.status === 'open' ? 'Close' : 'Reopen'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function Saved() {
  const [list, setList] = useState(null);
  useEffect(() => { api('/favorites').then(setList); }, []);
  return (
    <>
      <div className="dash-head"><h1>Saved Teachers</h1></div>
      {!list ? <Spinner /> : list.length === 0 ? <Empty title="No saved teachers yet" icon="heart"><Link href="/search">Find teachers</Link> and tap the heart to save them.</Empty> : (
        <div className="grid-2 gap-m">{list.map((t) => <TeacherMiniCard key={t.id} t={t} />)}</div>
      )}
    </>
  );
}

// Shell shared by every /student/* route (see app/(dashboard)/student/layout.jsx).
export default function StudentDashboard({ children }) {
  return (
    <DashboardLayout
      subtitle="Student"
      items={[
        { to: '/student', label: 'My Requirements', icon: 'leads', end: true },
        { to: '/student/saved', label: 'Saved Teachers', icon: 'heart' },
        { to: '/search', label: 'Find Teachers', icon: 'search' },
      ]}
    >
      {children}
    </DashboardLayout>
  );
}
