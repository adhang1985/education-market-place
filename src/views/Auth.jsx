'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { dashboardPath, useAuth } from '@/context/AuthContext';
import { Alert, Avatar } from '@/components/ui';
import Icon from '@/components/Icon';

const ASIDE = {
  login: {
    title: 'Welcome back to your learning journey',
    text: 'Pick up right where you left off – your teachers, requirements and messages are waiting.',
    points: ['Verified teachers across 40+ subjects', 'Your contact details stay private', 'Online classes or home tuition'],
  },
  student: {
    title: 'Find the perfect teacher in minutes',
    text: 'Create a free account to post requirements, save teachers and get matched faster.',
    points: ['Free for students & parents', 'Compare ratings, fees and experience', 'Only teachers you approve can contact you'],
  },
  teacher: {
    title: 'Grow your tuition business with TutorHub',
    text: 'Get discovered by thousands of students looking for teachers just like you.',
    points: ['Free, verified teacher profile', 'Preview student leads at no cost', 'Unlock contacts with TutorHub Pro'],
  },
};

function AuthShell({ variant, children }) {
  const a = ASIDE[variant];
  return (
    <div className="auth-split">
      <aside className="auth-aside">
        <h2>{a.title}</h2>
        <p>{a.text}</p>
        <ul className="cta-list">
          {a.points.map((x) => <li key={x}><span className="tick"><Icon name="check" size={13} strokeWidth={3} /></span>{x}</li>)}
        </ul>
        {/* Illustrative quote – replace with a real review before launch. */}
        <div className="quote-card">
          <p>“I found a fantastic physics tutor in two days. The whole process felt safe and effortless.”</p>
          <div className="row gap-s">
            <Avatar name="Sanya Kapoor" size={38} />
            <div className="small"><b>Sanya Kapoor</b><div style={{ opacity: 0.8 }}>Class 12 student, Mumbai</div></div>
          </div>
        </div>
      </aside>
      <div className="auth-main">{children}</div>
    </div>
  );
}

const DEMO = [
  ['Student', 'neha@tutorhub.com', 'student123'],
  ['Teacher (Pro)', 'priya@tutorhub.com', 'teacher123'],
  ['Teacher (Free)', 'sneha@tutorhub.com', 'teacher123'],
  ['Admin', 'admin@tutorhub.com', 'admin123'],
];

export function Login({ next = null }) {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      router.replace(next || dashboardPath(user));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell variant="login">
      <form className="auth-card fade-up" onSubmit={submit}>
        <h1>Welcome back 👋</h1>
        <p className="muted">Log in to continue to TutorHub</p>
        <Alert>{error}</Alert>
        <label className="field"><span>Email</span><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="field"><span>Password</span><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
        <p className="muted small center">New here? <Link href="/signup">Create an account</Link></p>
        <div className="demo">
          <span className="muted small"><b>Try a demo account:</b></span>
          {DEMO.map(([label, email, password]) => (
            <button type="button" key={email} className="chip" onClick={() => setForm({ email, password })}>{label}</button>
          ))}
        </div>
      </form>
    </AuthShell>
  );
}

export function Signup({ initialRole = 'student' }) {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [teacher, setTeacher] = useState({ headline: '', city: '', rate: '', experience: '', categories: [] });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/categories').then((c) => setCategories(c.filter((x) => x.slug !== 'other'))).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { ...form, role };
      if (role === 'teacher') body.teacher = { ...teacher, rate: Number(teacher.rate) || 0, experience: Number(teacher.experience) || 0 };
      const user = await register(body);
      router.replace(role === 'teacher' ? '/teacher/profile' : dashboardPath(user));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleCat = (slug) =>
    setTeacher({ ...teacher, categories: teacher.categories.includes(slug) ? teacher.categories.filter((c) => c !== slug) : [...teacher.categories, slug] });

  return (
    <AuthShell variant={role}>
      <form className="auth-card fade-up" onSubmit={submit}>
        <h1>Create your account</h1>
        <p className="muted">It’s free and takes less than a minute.</p>
        <div className="segmented">
          <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}><Icon name="book" size={17} /> I want to learn</button>
          <button type="button" className={role === 'teacher' ? 'active' : ''} onClick={() => setRole('teacher')}><Icon name="grad" size={17} /> I want to teach</button>
        </div>
        <Alert>
          {error}
          {error && /already exists/i.test(error) && <> <Link href="/login">Log in instead</Link></>}
        </Alert>
        <label className="field"><span>Full name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="field"><span>Email</span><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91" /></label>
        <label className="field"><span>Password</span><input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>

        {role === 'teacher' && (
          <>
            <label className="field"><span>What do you teach?</span><input required value={teacher.headline} onChange={(e) => setTeacher({ ...teacher, headline: e.target.value })} placeholder="e.g. Maths, Science" /></label>
            <div className="grid-3 gap-s">
              <label className="field"><span>City</span><input required value={teacher.city} onChange={(e) => setTeacher({ ...teacher, city: e.target.value })} /></label>
              <label className="field"><span>Fee ₹/hr</span><input type="number" min="0" value={teacher.rate} onChange={(e) => setTeacher({ ...teacher, rate: e.target.value })} /></label>
              <label className="field"><span>Experience (yrs)</span><input type="number" min="0" value={teacher.experience} onChange={(e) => setTeacher({ ...teacher, experience: e.target.value })} /></label>
            </div>
            <div className="field">
              <span>Categories</span>
              <div className="chips">
                {categories.map((c) => (
                  <button type="button" key={c.slug} className={`chip ${teacher.categories.includes(c.slug) ? 'active' : ''}`} onClick={() => toggleCat(c.slug)}>{c.short}</button>
                ))}
              </div>
            </div>
            <p className="muted small">Your profile will be reviewed by our team before it appears in search.</p>
          </>
        )}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Sign Up'}</button>
        <p className="muted small center">Already have an account? <Link href="/login">Log in</Link></p>
      </form>
    </AuthShell>
  );
}
