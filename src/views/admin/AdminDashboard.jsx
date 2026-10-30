'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import LineChart from '@/components/LineChart';
import Icon from '@/components/Icon';
import { Avatar, Badge, Empty, Spinner, StatCard } from '@/components/ui';
import { budget, inr, timeAgo } from '@/lib/utils';

// Lets child routes refresh the sidebar's pending-approval / open-report badges.
const AdminCounts = createContext({ refresh: () => {}, onStats: () => {} });

const STATUS_TONE = { approved: 'green', pending: 'orange', rejected: 'red' };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');

function Overview({ onChange }) {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);
  const [showTable, setShowTable] = useState(false);
  useEffect(() => { setD(null); api('/admin/stats', { params: { days } }).then((x) => { setD(x); onChange?.(x); }); }, [days, onChange]);

  if (!d) return <Spinner />;
  const c = d.cards;
  const growth = d.growth.map((g) => ({ x: g.month, teachers: g.teachers, students: g.students }));
  return (
    <>
      <div className="row-between dash-head">
        <div><h1>Dashboard</h1><p className="muted">Platform Overview</p></div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Comparison period">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>
      <div className="grid-4 gap-m">
        <StatCard icon="users" tone="blue" value={c.teachers.value.toLocaleString('en-IN')} label="Registered Teachers" change={c.teachers.change} />
        <StatCard icon="file" tone="green" value={c.requirements.value.toLocaleString('en-IN')} label="Student Requirements" change={c.requirements.change} />
        <StatCard icon="crown" tone="blue" value={c.proSubscriptions.value.toLocaleString('en-IN')} label="Pro Subscriptions" change={c.proSubscriptions.change} />
        <StatCard icon="rupee" tone="green" value={inr(c.revenue.value)} label="Total Revenue" change={c.revenue.change} />
      </div>
      <p className="muted small mt-s">% change compares new records in the selected period with the period before it.</p>

      <div className="card mt-m">
        <div className="row-between">
          <h3>User Growth</h3>
          <button className="link small" onClick={() => setShowTable(!showTable)}>{showTable ? 'Show chart' : 'Show table'}</button>
        </div>
        {showTable ? (
          <table className="table">
            <thead><tr><th>Month</th><th>Teachers</th><th>Students</th></tr></thead>
            <tbody>{d.growth.map((g) => <tr key={g.month}><td>{g.month}</td><td>{g.teachers}</td><td>{g.students}</td></tr>)}</tbody>
          </table>
        ) : (
          <LineChart
            data={growth}
            series={[{ key: 'teachers', label: 'Teachers', color: '#4f46e5' }, { key: 'students', label: 'Students', color: '#0d9488' }]}
            area={false}
            height={240}
            ariaLabel="Cumulative teachers and students by month"
          />
        )}
      </div>

      <div className="dash-grid mt-m">
        <div className="card">
          <h3>Recent Registrations</h3>
          {d.recent.map((u) => (
            <div key={u.id} className="list-row">
              <Avatar name={u.name} size={38} />
              <div className="grow"><b>{u.name}</b><div className="muted small">{cap(u.role)} • {timeAgo(u.createdAt)}</div></div>
              <Badge tone={STATUS_TONE[u.status]}>{cap(u.status)}</Badge>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Quick Actions</h3>
          <div className="stack">
            <button className="btn btn-outline btn-block left" onClick={() => router.push('/admin/approvals')}><Icon name="users" /> Approve Teachers {d.pendingApprovals ? `(${d.pendingApprovals})` : ''}</button>
            <button className="btn btn-outline btn-block left" onClick={() => router.push('/admin/requirements')}><Icon name="file" /> View Requirements</button>
            <button className="btn btn-outline btn-block left" onClick={() => router.push('/admin/subscriptions')}><Icon name="card" /> Manage Subscriptions</button>
            <button className="btn btn-outline btn-block left" onClick={() => router.push('/admin/reports')}><Icon name="flag" /> Lead Reports {d.openReports ? `(${d.openReports})` : ''}</button>
          </div>
        </div>
      </div>
    </>
  );
}

function Approvals({ onChange }) {
  const [list, setList] = useState(null);
  const load = useCallback(() => api('/admin/users', { params: { role: 'teacher', status: 'pending' } }).then(setList), []);
  useEffect(() => { load(); }, [load]);
  const act = async (id, status) => {
    await api(`/admin/users/${id}/status`, { method: 'PATCH', body: { status } });
    setList(list.filter((u) => u.id !== id));
    onChange?.();
  };
  return (
    <>
      <div className="dash-head"><h1>Teacher Approvals</h1><p className="muted">Verify new teacher profiles before they appear in search.</p></div>
      {!list ? <Spinner /> : list.length === 0 ? <Empty title="All caught up – no pending teachers" icon="check" /> : (
        <div className="stack">
          {list.map((u) => (
            <div key={u.id} className="card req-row">
              <Avatar name={u.name} size={52} />
              <div className="grow">
                <b>{u.name}</b> <span className="muted small">• {u.email} • joined {timeAgo(u.createdAt)}</span>
                <div className="small">{u.teacher.headline} • {u.teacher.city} • {u.teacher.experience} yrs • {inr(u.teacher.rate)}/hr</div>
                <div className="muted small">{u.teacher.qualification} {u.teacher.subjects.map((s) => s.name).join(', ')}</div>
                {u.teacher.bio && <p className="small">{u.teacher.bio}</p>}
              </div>
              <div className="row gap-s">
                <Link href={`/teachers/${u.id}`} className="btn btn-outline btn-sm">Preview</Link>
                <button className="btn btn-danger btn-sm" onClick={() => act(u.id, 'rejected')}>Reject</button>
                <button className="btn btn-primary btn-sm" onClick={() => act(u.id, 'approved')}>Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function Users() {
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => api('/admin/users', { params: { role, q } }).then(setList), 250);
    return () => clearTimeout(t);
  }, [role, q]);
  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    await api(`/admin/users/${u.id}`, { method: 'DELETE' });
    setList(list.filter((x) => x.id !== u.id));
  };
  const setStatus = async (u, status) => {
    await api(`/admin/users/${u.id}/status`, { method: 'PATCH', body: { status } });
    setList(list.map((x) => (x.id === u.id ? { ...x, status } : x)));
  };
  return (
    <>
      <div className="dash-head"><h1>Manage Users</h1></div>
      <div className="row gap-s mb-m">
        <input className="grow" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option><option value="teacher">Teachers</option><option value="student">Students</option>
        </select>
      </div>
      <div className="card table-wrap">
        {!list ? <Spinner /> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th /></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>{u.role === 'teacher' ? <Link href={`/teachers/${u.id}`}>{u.name}</Link> : u.name} {u.isPro && <Badge tone="violet">Pro</Badge>}</td>
                  <td className="muted">{u.email}</td>
                  <td>{cap(u.role)}</td>
                  <td>
                    {u.role === 'teacher' ? (
                      <select value={u.status} onChange={(e) => setStatus(u, e.target.value)} className={`select-sm tone-text-${STATUS_TONE[u.status]}`}>
                        <option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
                      </select>
                    ) : '—'}
                  </td>
                  <td className="muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td><button className="link danger small" onClick={() => remove(u)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export function Requirements() {
  const [list, setList] = useState(null);
  const [status, setStatus] = useState('');
  useEffect(() => { setList(null); api('/admin/requirements', { params: { status } }).then(setList); }, [status]);
  const patch = async (r, body) => {
    const res = await api(`/admin/requirements/${r.id}`, { method: 'PATCH', body });
    setList(list.map((x) => (x.id === r.id ? { ...x, ...res } : x)));
  };
  return (
    <>
      <div className="row-between dash-head">
        <h1>Student Requirements</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option><option value="open">Open</option><option value="closed">Closed</option></select>
      </div>
      <div className="card table-wrap">
        {!list ? <Spinner /> : list.length === 0 ? <Empty title="No requirements" /> : (
          <table className="table">
            <thead><tr><th>Requirement</th><th>Student</th><th>Budget</th><th>Unlocks</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/leads/${r.id}`}>{r.title}</Link><div className="muted small">{r.categoryName} • {r.location} • {timeAgo(r.createdAt)}</div></td>
                  <td>{r.student}<div className="muted small">{r.contact?.phone}</div></td>
                  <td className="small">{budget(r)}</td>
                  <td>{r.unlocks}{r.reports ? <Badge tone="orange">{r.reports} reported</Badge> : null}</td>
                  <td><Badge tone={r.status === 'open' ? 'green' : 'gray'}>{cap(r.status)}</Badge> {r.verified && <Badge tone="blue">Verified</Badge>}</td>
                  <td className="nowrap">
                    <button className="link small" onClick={() => patch(r, { verified: !r.verified })}>{r.verified ? 'Unverify' : 'Verify'}</button>{' · '}
                    <button className="link small" onClick={() => patch(r, { status: r.status === 'open' ? 'closed' : 'open' })}>{r.status === 'open' ? 'Close' : 'Reopen'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export function Subscriptions() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/admin/subscriptions').then(setD); }, []);
  if (!d) return <Spinner />;
  return (
    <>
      <div className="dash-head"><h1>Subscriptions</h1></div>
      <div className="card table-wrap">
        <h3>Pro subscribers</h3>
        <table className="table">
          <thead><tr><th>Teacher</th><th>Status</th><th>Valid until</th><th>Credits left</th></tr></thead>
          <tbody>
            {d.subscribers.map((s) => (
              <tr key={s.id}><td>{s.name}<div className="muted small">{s.email}</div></td><td><Badge tone={s.active ? 'green' : 'gray'}>{s.active ? 'Active' : 'Expired'}</Badge></td><td>{new Date(s.validUntil).toLocaleDateString('en-IN')}</td><td>{s.credits}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card table-wrap mt-m">
        <h3>Payments</h3>
        <table className="table">
          <thead><tr><th>Date</th><th>Teacher</th><th>Amount</th><th>Reference</th></tr></thead>
          <tbody>
            {d.payments.map((p) => (
              <tr key={p.id}><td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td><td>{p.teacher}</td><td>{inr(p.amount)}</td><td className="muted small">{p.reference}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Reports({ onChange }) {
  const [list, setList] = useState(null);
  useEffect(() => { api('/admin/reports').then(setList); }, []);
  const resolve = async (id, refund) => {
    await api(`/admin/reports/${id}/resolve`, { method: 'POST', body: { refund } });
    setList(list.filter((r) => r.id !== id));
    onChange?.();
  };
  return (
    <>
      <div className="dash-head"><h1>Lead Reports</h1><p className="muted">Teachers flag duplicate or invalid leads. Refunding returns 1 credit.</p></div>
      {!list ? <Spinner /> : list.length === 0 ? <Empty title="No open reports" icon="flag" /> : (
        <div className="stack">
          {list.map((r) => (
            <div key={r.id} className="card req-row">
              <div className="grow"><b>{r.lead}</b> <span className="muted small">• {r.category}</span><div className="small">Reported by {r.teacher} ({r.teacherEmail}) {timeAgo(r.reportedAt)}</div><div className="small">Reason: “{r.reason}”</div></div>
              <div className="row gap-s">
                <button className="btn btn-outline btn-sm" onClick={() => resolve(r.id, false)}>Dismiss</button>
                <button className="btn btn-primary btn-sm" onClick={() => resolve(r.id, true)}>Refund credit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export const AdminOverview = () => <Overview onChange={useContext(AdminCounts).onStats} />;
export const AdminApprovals = () => <Approvals onChange={useContext(AdminCounts).refresh} />;
export const AdminReports = () => <Reports onChange={useContext(AdminCounts).refresh} />;

// Shell shared by every /admin/* route (see app/(dashboard)/admin/layout.jsx).
export default function AdminDashboard({ children }) {
  const [counts, setCounts] = useState({});
  const refresh = useCallback(() => api('/admin/stats').then((d) => setCounts({ pending: d.pendingApprovals, reports: d.openReports })), []);
  const onStats = useCallback((d) => setCounts({ pending: d.pendingApprovals, reports: d.openReports }), []);
  useEffect(() => { refresh(); }, [refresh]);

  const items = [
    { to: '/admin', label: 'Dashboard', icon: 'grid', end: true },
    { to: '/admin/users', label: 'Manage Users', icon: 'users' },
    { to: '/admin/approvals', label: 'Teacher Approvals', icon: 'user', badge: counts.pending },
    { to: '/admin/requirements', label: 'Student Requirements', icon: 'file' },
    { to: '/admin/subscriptions', label: 'Subscriptions', icon: 'card' },
    { to: '/admin/reports', label: 'Lead Reports', icon: 'flag', badge: counts.reports },
  ];
  return (
    <DashboardLayout items={items} subtitle="Administrator">
      <AdminCounts.Provider value={{ refresh, onStats }}>{children}</AdminCounts.Provider>
    </DashboardLayout>
  );
}
