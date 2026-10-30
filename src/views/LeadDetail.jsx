'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/Icon';
import { Alert, Badge, Empty, Spinner } from '@/components/ui';
import { budget, classLabel, inr, MODE_LABEL, timeAgo } from '@/lib/utils';

// `initial` is the anonymous preview rendered on the server; logged-in users refetch to get unlock state.
export default function LeadDetail({ initial = null }) {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [lead, setLead] = useState(initial);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initial || getToken()) api(`/leads/${id}`).then(setLead).catch((e) => setError(e.message));
  }, [id, initial]);

  const isTeacher = user?.role === 'teacher';
  const sub = user?.subscription;

  const unlock = async () => {
    if (!user) return router.push(`/login?next=${encodeURIComponent(`/leads/${id}`)}`);
    setBusy(true);
    setMsg(null);
    try {
      const { lead: l, credits } = await api(`/leads/${id}/unlock`, { method: 'POST' });
      setLead(l);
      setUser({ ...user, subscription: { ...user.subscription, credits } });
      setMsg({ tone: 'success', text: 'Contact unlocked. Please reach out only about this learning request.' });
    } catch (e) {
      setMsg({ tone: 'error', text: e.message, code: e.code });
    } finally {
      setBusy(false);
    }
  };

  const report = async () => {
    const reason = window.prompt('What is wrong with this lead? (e.g. duplicate, wrong number, not interested)');
    if (!reason) return;
    try {
      const { message } = await api(`/leads/${id}/report`, { method: 'POST', body: { reason } });
      setLead({ ...lead, reported: true });
      setMsg({ tone: 'success', text: message });
    } catch (e) {
      setMsg({ tone: 'error', text: e.message });
    }
  };

  if (error) return <div className="container page"><Empty title={error} icon="leads" /></div>;
  if (!lead) return <div className="container page"><Spinner /></div>;

  const rows = [
    ['Category', lead.categoryName],
    ['Class', classLabel(lead.studentClass)],
    ['Subjects', lead.subjects?.join(', ')],
    ['Learning goal', lead.learningGoal],
    ['Current level', lead.level],
    ['Preferred format', MODE_LABEL[lead.mode]],
    ['Schedule', lead.schedule],
    ['Budget', budget(lead)],
    ['Location', lead.location],
    ['Student message', lead.details],
  ].filter(([, v]) => v);

  return (
    <div className="container page">
      <Link href={isTeacher ? '/teacher/leads' : '/leads'} className="back-link"><Icon name="arrowLeft" size={15} /> Back to Leads</Link>

      {!lead.unlocked && (
        <div className="pro-banner">
          <span className="crown"><Icon name="crown" size={22} /></span>
          <div><b>This is a Pro Lead</b><div className="small">Unlock contact details to connect with the student.</div></div>
        </div>
      )}

      <div className="lead-layout">
        <div className="card lead-main">
          <div className="row-between">
            <span className="chip-soft">Student Requirement</span>
            <div className="row gap-s">
              {lead.isNew && <Badge tone="pink">New</Badge>}
              {lead.verified && <Badge tone="green">Verified</Badge>}
            </div>
          </div>
          <h1>{lead.title}</h1>
          <div className="row gap-m muted small wrap">
            <span><Icon name="pin" size={14} /> {MODE_LABEL[lead.mode]}</span>
            <span><Icon name="clock" size={14} /> Posted {timeAgo(lead.createdAt)}</span>
          </div>
          <hr />
          <dl className="kv">
            {rows.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <div className="privacy-note">
            Privacy note: student name, phone and email stay hidden until consent and unlock.<br />
            Only contact students for the learning request they submitted.
          </div>
        </div>

        <div className="lead-side">
          <div className="card">
            {lead.unlocked && lead.contact ? (
              <>
                <h2>Contact Details</h2>
                <div className="contact-line"><Icon name="user" /> {lead.contact.name}</div>
                <div className="contact-line"><Icon name="phone" /> <a href={`tel:${lead.contact.phone}`}>{lead.contact.phone}</a></div>
                <div className="contact-line"><Icon name="mail" /> <a href={`mailto:${lead.contact.email}`}>{lead.contact.email}</a></div>
                <div className="contact-line"><Icon name="pin" /> {lead.contact.address}</div>
                {isTeacher && (
                  lead.reported
                    ? <p className="muted small mt-m">Replacement requested – our team is reviewing.</p>
                    : <button className="link small mt-m" onClick={report}><Icon name="flag" size={13} /> Duplicate or invalid? Request a replacement</button>
                )}
              </>
            ) : (
              <>
                <h2>Unlock this lead</h2>
                <p className="muted small">Contact details become visible after student consent.</p>
                <div className="hidden-contact">
                  <div className="contact-line blur"><Icon name="phone" /> {lead.maskedContact?.phone}</div>
                  <div className="contact-line"><Icon name="pin" /> {lead.maskedContact?.area}</div>
                </div>
                <div className="pro-box">
                  <b>TutorHub Pro</b>
                  <div className="small">{inr(299)} / month • 10 contact unlocks</div>
                  {isTeacher && sub?.active && <div className="small mt-s"><b>{sub.credits}</b> / {sub.creditsTotal || 10} credits remaining</div>}
                </div>
                <Alert tone={msg?.tone}>{msg?.text}</Alert>
                {msg?.code === 'NOT_PRO' || msg?.code === 'NO_CREDITS' ? (
                  <Link href="/for-teachers" className="btn btn-primary btn-block">{msg.code === 'NOT_PRO' ? 'Subscribe to Pro' : 'Renew / Upgrade'}</Link>
                ) : user && !isTeacher ? (
                  <p className="muted small">Only teacher accounts can unlock leads.</p>
                ) : !lead.consent ? (
                  <p className="muted small">The student hasn’t granted consent yet. Check back soon.</p>
                ) : (
                  <button className="btn btn-primary btn-block" onClick={unlock} disabled={busy}>
                    <Icon name="unlock" size={17} /> {busy ? 'Unlocking…' : user ? 'Unlock Contact (1 credit)' : 'Log in to unlock'}
                  </button>
                )}
                <p className="muted small mt-s">If a lead is duplicate or invalid, request a replacement.</p>
              </>
            )}
            {lead.unlocked && msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          </div>

          <div className="card">
            <h3>Teacher sees before unlock</h3>
            <ul className="dot-list">
              <li>Category and learning goal</li>
              <li>Budget, mode and schedule</li>
              <li>Approximate location</li>
              <li>No personal contact details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
