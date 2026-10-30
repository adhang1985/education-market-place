'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/Icon';
import { Alert } from '@/components/ui';
import { inr } from '@/lib/utils';

export default function Subscription({ initialPlan = null }) {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { if (!initialPlan) api('/subscription/plan').then(setPlan).catch(() => {}); }, [initialPlan]);

  const sub = user?.subscription;
  const active = sub?.active;

  const subscribe = async () => {
    if (!user) return router.push('/signup?role=teacher');
    if (user.role !== 'teacher') return setMsg({ tone: 'error', text: 'Pro plans are for teacher accounts.' });
    if (!window.confirm(`Pay ${inr(plan.price)} for 30 days of TutorHub Pro? (demo checkout – no real payment)`)) return;
    setBusy(true);
    try {
      const { user: u, message } = await api('/subscription/subscribe', { method: 'POST' });
      setUser(u);
      setMsg({ tone: 'success', text: `${message} You now have ${u.subscription.credits} contact unlocks.` });
    } catch (e) {
      setMsg({ tone: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="pro-hero">
        <div className="container center">
          <span className="eyebrow pill"><span className="dot">Pro</span> For teachers who want to grow</span>
          <h1>Go Pro for <span className="gradient-text">more opportunities</span></h1>
          <p className="muted lead">Unlock student contact details, get priority visibility and grow your tuition business.</p>
          {msg && <div className="narrow mt-m"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
          {plan && (
            <div className="plan-card">
              <span className="ribbon">Most Popular</span>
              <h2>{plan.name}</h2>
              <div className="plan-price"><b>{inr(plan.price)}</b> / {plan.period}</div>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}><span className="tick"><Icon name="check" size={13} strokeWidth={3} /></span>{f}</li>
                ))}
              </ul>
              {active && (
                <p className="small muted">
                  Active until <b>{new Date(sub.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</b> • {sub.credits} unlocks left
                </p>
              )}
              <button className="btn btn-primary btn-block btn-lg" onClick={subscribe} disabled={busy}>
                {busy ? 'Processing…' : active ? 'Renew (+10 unlocks)' : 'Subscribe Now'}
              </button>
            </div>
          )}
        </div>
      </section>
      <section className="container why-section">
        <div className="section-intro">
          <span className="eyebrow">Why Pro</span>
          <h2>Everything you need to grow faster</h2>
        </div>
        <div className="grid-3 why">
          <div className="why-card tone-bg-orange"><span className="why-icon tone-orange"><Icon name="heart" /></span><h3>More Leads</h3><p>Be visible to serious students first</p></div>
          <div className="why-card tone-bg-teal"><span className="why-icon tone-teal"><Icon name="phone" /></span><h3>Direct Contact</h3><p>Get phone numbers & addresses</p></div>
          <div className="why-card tone-bg-violet"><span className="why-icon tone-violet"><Icon name="chart" /></span><h3>Grow Faster</h3><p>Reach more students and increase your income</p></div>
        </div>
      </section>
    </>
  );
}
