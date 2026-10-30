'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Alert } from '@/components/ui';

const toForm = (u) => {
  const t = u.teacher || {};
  return {
    name: u.name, phone: u.phone || '', headline: t.headline || '', bio: t.bio || '', experience: t.experience ?? '', rate: t.rate ?? '',
    city: t.city || '', modes: t.modes || [], onlinePlatforms: t.onlinePlatforms || '', qualification: t.qualification || '',
    teachingSince: t.teachingSince || '', languages: (t.languages || []).join(', '), categories: t.categories || [],
    subjects: t.subjects?.length ? t.subjects.map((s) => ({ ...s })) : [{ name: '', classFrom: '', classTo: '', label: '' }],
  };
};

export default function TeacherProfileEditor() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(() => toForm(user));
  const [cats, setCats] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/categories').then((c) => setCats(c.filter((x) => x.slug !== 'other'))); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (k, v) => setForm({ ...form, [k]: form[k].includes(v) ? form[k].filter((x) => x !== v) : [...form[k], v] });
  const setSubject = (i, k, v) => setForm({ ...form, subjects: form.subjects.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const body = {
        ...form,
        experience: Number(form.experience) || 0,
        rate: Number(form.rate) || 0,
        teachingSince: Number(form.teachingSince) || undefined,
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const { user: u } = await api('/teacher/profile', { method: 'PUT', body });
      setUser(u);
      setForm(toForm(u));
      setMsg({ tone: 'success', text: 'Profile saved.' });
    } catch (err) {
      setMsg({ tone: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save}>
      <div className="row-between dash-head">
        <div>
          <h1>My Profile</h1>
          <p className="muted">This is what students see. Status: <b>{user.teacher?.status}</b></p>
        </div>
        <Link href={`/teachers/${user.id}`} className="btn btn-outline">View public profile</Link>
      </div>
      <Alert tone={msg?.tone}>{msg?.text}</Alert>

      <div className="card form-card">
        <h3>Basics</h3>
        <div className="grid-2 gap-m">
          <label className="field"><span>Full name</span><input value={form.name} onChange={set('name')} required /></label>
          <label className="field"><span>Phone (private)</span><input value={form.phone} onChange={set('phone')} /></label>
          <label className="field"><span>Headline</span><input value={form.headline} onChange={set('headline')} placeholder="e.g. Maths, Science" /></label>
          <label className="field"><span>City</span><input value={form.city} onChange={set('city')} /></label>
          <label className="field"><span>Fee (₹ per hour)</span><input type="number" min="0" value={form.rate} onChange={set('rate')} /></label>
          <label className="field"><span>Experience (years)</span><input type="number" min="0" value={form.experience} onChange={set('experience')} /></label>
          <label className="field"><span>Qualification</span><input value={form.qualification} onChange={set('qualification')} /></label>
          <label className="field"><span>Teaching since (year)</span><input type="number" value={form.teachingSince} onChange={set('teachingSince')} /></label>
        </div>
        <label className="field"><span>Languages (comma separated)</span><input value={form.languages} onChange={set('languages')} /></label>
        <label className="field"><span>About me</span><textarea rows={4} value={form.bio} onChange={set('bio')} /></label>
      </div>

      <div className="card form-card mt-m">
        <h3>Teaching</h3>
        <div className="field">
          <span>Teaching mode</span>
          <div className="radios">
            <label className="check"><input type="checkbox" checked={form.modes.includes('online')} onChange={() => toggle('modes', 'online')} /> Online classes</label>
            <label className="check"><input type="checkbox" checked={form.modes.includes('home')} onChange={() => toggle('modes', 'home')} /> At student’s home</label>
          </div>
        </div>
        {form.modes.includes('online') && <label className="field"><span>Online platforms</span><input value={form.onlinePlatforms} onChange={set('onlinePlatforms')} /></label>}
        <div className="field">
          <span>Categories (used to match you with leads)</span>
          <div className="chips">
            {cats.map((c) => (
              <button type="button" key={c.slug} className={`chip ${form.categories.includes(c.slug) ? 'active' : ''}`} onClick={() => toggle('categories', c.slug)}>{c.short}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Subjects & classes</span>
          {form.subjects.map((s, i) => (
            <div key={i} className="subject-edit">
              <input placeholder="Subject" value={s.name} onChange={(e) => setSubject(i, 'name', e.target.value)} />
              <input type="number" min="1" max="12" placeholder="Class from" value={s.classFrom ?? ''} onChange={(e) => setSubject(i, 'classFrom', e.target.value)} />
              <input type="number" min="1" max="12" placeholder="Class to" value={s.classTo ?? ''} onChange={(e) => setSubject(i, 'classTo', e.target.value)} />
              <input placeholder="or level (e.g. Beginner)" value={s.label || ''} onChange={(e) => setSubject(i, 'label', e.target.value)} />
              <button type="button" className="icon-btn" onClick={() => setForm({ ...form, subjects: form.subjects.filter((_, j) => j !== i) })} aria-label="Remove subject">×</button>
            </div>
          ))}
          <button type="button" className="link small" onClick={() => setForm({ ...form, subjects: [...form.subjects, { name: '' }] })}>+ Add subject</button>
        </div>
      </div>
      <div className="row-end mt-m"><button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></div>
    </form>
  );
}
