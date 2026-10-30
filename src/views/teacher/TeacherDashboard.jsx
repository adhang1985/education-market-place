'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import LineChart from '@/components/LineChart';
import Icon from '@/components/Icon';
import { LeadRow, LeadCard } from '@/components/Cards';
import { Empty, Spinner, StatCard } from '@/components/ui';
import { LeadsBoard } from '@/views/Leads';
import { inr, timeAgo } from '@/lib/utils';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function SubscriptionBox({ sub }) {
  return (
    <div className="card sub-box">
      <h3>Your Subscription</h3>
      {sub.active ? (
        <>
          <div className="sub-plan"><b>Pro Teacher</b><span>Valid till {fmtDate(sub.validUntil)}</span></div>
          <div className="sub-credits"><b>{sub.credits} / {sub.creditsTotal || 10}</b><span>Contacts Remaining</span></div>
        </>
      ) : (
        <div className="sub-plan free"><b>Free plan</b><span>Upgrade to unlock student contacts</span></div>
      )}
      <Link href="/for-teachers" className="btn btn-primary btn-block">Upgrade / Renew</Link>
    </div>
  );
}

export function Overview() {
  const { user, setUser } = useAuth();
  const [d, setD] = useState(null);
  useEffect(() => { api('/teacher/dashboard').then(setD); }, []);

  const toggle = async (e) => {
    const available = e.target.value === 'online';
    await api('/teacher/availability', { method: 'PUT', body: { available } });
    setD({ ...d, available });
    setUser({ ...user, teacher: { ...user.teacher, available } });
  };

  if (!d) return <Spinner />;
  const series = d.viewsSeries.map((p) => ({ x: p.date, views: p.value }));
  return (
    <>
      <div className="row-between dash-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Here’s what’s happening with your profile</p>
        </div>
        <select className={`status-select ${d.available ? 'on' : 'off'}`} value={d.available ? 'online' : 'away'} onChange={toggle} aria-label="Availability">
          <option value="online">● Online</option>
          <option value="away">● Away</option>
        </select>
      </div>
      {d.status !== 'approved' && (
        <div className="alert alert-warn">
          Your profile is <b>{d.status}</b>. {d.status === 'pending' ? 'Our team will verify it shortly – complete your profile to speed this up.' : 'Please update your profile and it will be re-reviewed.'}{' '}
          <Link href="/teacher/profile">Edit profile</Link>
        </div>
      )}
      <div className="grid-4 gap-m">
        <StatCard icon="leads" tone="violet" value={d.stats.newLeads} label="New Leads" sub="This month" />
        <StatCard icon="unlock" tone="purple" value={d.stats.contactsUnlocked} label="Contacts Unlocked" />
        <StatCard icon="user" tone="orange" value={d.stats.profileViews} label="Profile Views" sub="Last 30 days" />
        <StatCard icon="star" tone="amber" value={d.stats.rating || '—'} label="Average Rating" sub={`${d.stats.reviewsCount} reviews`} />
      </div>
      <div className="dash-grid mt-m">
        <div className="card">
          <div className="row-between"><h3>Recent Leads</h3><Link href="/teacher/leads" className="link small">View All <Icon name="arrowRight" size={14} /></Link></div>
          {d.recentLeads.length ? d.recentLeads.map((l) => <LeadRow key={l.id} lead={l} />) : <Empty title="No matching leads yet" icon="leads">Add more subjects and categories to your profile.</Empty>}
        </div>
        <div className="stack">
          <SubscriptionBox sub={d.subscription} />
          <div className="card">
            <div className="row-between"><h3>Profile Performance</h3><span className="muted small">Last 30 days</span></div>
            <div className="small muted">Profile Views</div>
            <div className="perf-value">{d.stats.profileViews} {d.stats.viewsChange !== null && <span className={d.stats.viewsChange >= 0 ? 'up' : 'down'}>{d.stats.viewsChange >= 0 ? '+' : ''}{d.stats.viewsChange}%</span>}</div>
            <LineChart
              data={series}
              series={[{ key: 'views', label: 'Profile views', color: '#4f46e5' }]}
              height={170}
              showXEvery={7}
              formatX={(x, long) => new Date(x).toLocaleDateString('en-IN', long ? { day: 'numeric', month: 'short', weekday: 'short' } : { day: 'numeric', month: 'short' })}
              ariaLabel="Profile views per day over the last 30 days"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function TeacherLeads() {
  const [tab, setTab] = useState('browse');
  const [unlocked, setUnlocked] = useState(null);
  useEffect(() => { if (tab === 'unlocked' && !unlocked) api('/teacher/unlocks').then(setUnlocked); }, [tab, unlocked]);
  return (
    <>
      <div className="dash-head">
        <h1>Leads</h1>
        <p className="muted">Preview student requirements for free. Unlock contact details with Pro credits.</p>
      </div>
      <div className="tabs">
        <button className={tab === 'browse' ? 'active' : ''} onClick={() => setTab('browse')}>Browse leads</button>
        <button className={tab === 'unlocked' ? 'active' : ''} onClick={() => setTab('unlocked')}>My unlocked contacts</button>
      </div>
      {tab === 'browse' ? <LeadsBoard compact /> : !unlocked ? <Spinner /> : unlocked.length === 0 ? (
        <Empty title="You haven't unlocked any contacts yet" icon="unlock" />
      ) : (
        <div className="grid-2 gap-m">
          {unlocked.map((l) => (
            <div key={l.id}>
              <LeadCard lead={l} />
              <div className="unlocked-contact small">
                <b>{l.contact.name}</b> • {l.contact.phone} • {l.contact.email} <span className="muted">• unlocked {timeAgo(l.unlockedAt)}</span>
                {l.reported && <span className="badge badge-orange">Replacement requested</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function MySubscription() {
  const { user } = useAuth();
  const sub = user.subscription;
  return (
    <>
      <div className="dash-head"><h1>My Subscription</h1></div>
      <div className="grid-2 gap-m">
        <SubscriptionBox sub={sub} />
        <div className="card">
          <h3>How credits work</h3>
          <ul className="dot-list">
            <li>Each Pro month gives you 10 contact unlocks for {inr(299)}.</li>
            <li>Unlocking the same lead again is free.</li>
            <li>Renewing early adds 30 days and 10 more credits.</li>
            <li>Report duplicate or invalid leads – approved reports refund the credit.</li>
          </ul>
        </div>
      </div>
    </>
  );
}

export function MyReviews() {
  const [reviews, setReviews] = useState(null);
  useEffect(() => { api('/teacher/reviews').then(setReviews); }, []);
  return (
    <>
      <div className="dash-head"><h1>Reviews</h1></div>
      <div className="card">
        {!reviews ? <Spinner /> : reviews.length === 0 ? <Empty title="No reviews yet" icon="star" /> : reviews.map((r) => (
          <div key={r.id} className="review">
            <div className="row-between"><b>{r.student}</b><span className="muted small">{timeAgo(r.createdAt)}</span></div>
            <div className="stars">{'★'.repeat(r.rating)}<span className="dim">{'★'.repeat(5 - r.rating)}</span></div>
            {r.comment && <p>{r.comment}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

// Shell shared by every /teacher/* route (see app/(dashboard)/teacher/layout.jsx).
export default function TeacherDashboard({ children }) {
  const items = [
    { to: '/teacher', label: 'Dashboard', icon: 'grid', end: true },
    { to: '/teacher/profile', label: 'My Profile', icon: 'user' },
    { to: '/teacher/leads', label: 'Leads', icon: 'leads' },
    { to: '/teacher/subscription', label: 'My Subscription', icon: 'card' },
    { to: '/teacher/reviews', label: 'Reviews', icon: 'star' },
  ];
  return (
    <DashboardLayout items={items} subtitle="Teacher">
      {children}
    </DashboardLayout>
  );
}
