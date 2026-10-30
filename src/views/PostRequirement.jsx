'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/Icon';
import { Alert } from '@/components/ui';
import { budget, CLASS_OPTIONS, classLabel, MODE_LABEL, SUBJECT_SUGGESTIONS } from '@/lib/utils';

const STEPS = ['Basic Details', 'Subject & Preferences', 'Review & Submit'];
const DRAFT_KEY = 'tutorhub_requirement_draft';

const empty = {
  studentClass: '', subjects: [], mode: 'either', location: '', details: '',
  category: '', title: '', learningGoal: '', level: '', schedule: '', budgetMin: '', budgetMax: '', budgetUnit: 'hour', address: '',
  contactPhone: '', consent: true,
};

function guessCategory(cls, subjects) {
  const s = subjects.join(' ').toLowerCase();
  const map = [
    ['programming', /python|sql|java|web|coding|ai/], ['exams', /jee|neet|upsc|ras|ssc|bank/], ['music', /guitar|keyboard|vocal|tabla|piano/],
    ['dance', /dance|kathak/], ['wellness', /yoga|meditation|fitness/], ['cooking', /bak|cuisine|cook/], ['career', /resume|interview|career/],
    ['astrology', /astrolog|kundli/], ['art', /draw|paint|craft/], ['languages', /spoken|french|german/],
  ];
  return map.find(([, rx]) => rx.test(s))?.[0] || (/^\d+$/.test(cls) ? 'school' : 'other');
}

export default function PostRequirement() {
  const { user, register } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    const subject = sp.get('subject');
    return { ...empty, ...saved, ...(subject && { subjects: [subject] }) };
  });
  const [subjectInput, setSubjectInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [account, setAccount] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [done, setDone] = useState(null);
  const teacherId = sp.get('teacher');
  const teacherName = sp.get('teacherName');

  useEffect(() => { api('/categories').then(setCategories).catch(() => {}); }, []);
  useEffect(() => { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form)); }, [form]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target?.type === 'checkbox' ? e.target.checked : e.target ? e.target.value : e });

  const addSubject = (s) => {
    const v = s.trim();
    if (v && !form.subjects.includes(v)) setForm({ ...form, subjects: [...form.subjects, v] });
    setSubjectInput('');
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return setError('Location is not supported by your browser');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=14`);
          const j = await r.json();
          const a = j.address || {};
          setForm((f) => ({ ...f, location: [a.suburb || a.neighbourhood || a.city_district, a.city || a.town || a.state_district].filter(Boolean).join(', ') }));
        } catch {
          setForm((f) => ({ ...f, location: `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}` }));
        } finally {
          setLocating(false);
        }
      },
      () => { setLocating(false); setError('Could not detect your location. Please type it in.'); }
    );
  };

  const validate = () => {
    if (step === 0) {
      if (!form.studentClass) return "Please select the student's class";
      if (!form.subjects.length) return 'Please add at least one subject';
      if (form.mode !== 'online' && !form.location.trim()) return 'Please enter your area / locality for in-person classes';
    }
    if (step === 1) {
      if (form.budgetMin && form.budgetMax && Number(form.budgetMin) > Number(form.budgetMax)) return 'Minimum budget cannot exceed maximum';
    }
    if (step === 2) {
      if (!user && (!account.name || !account.email || account.password.length < 6)) return 'Please fill your name, email and a password (6+ characters)';
      if (!form.contactPhone && !user?.phone) return 'Please add a phone number teachers can reach you on';
    }
    return '';
  };

  const next = () => {
    const err = validate();
    setError(err);
    if (err) return;
    if (step === 0 && !form.category) setForm((f) => ({ ...f, category: guessCategory(f.studentClass, f.subjects) }));
    setStep(step + 1);
  };

  const submit = async () => {
    const err = validate();
    setError(err);
    if (err) return;
    setBusy(true);
    try {
      let u = user;
      if (!u) u = await register({ ...account, phone: form.contactPhone, role: 'student' });
      if (u.role !== 'student') throw new Error('Only student accounts can post requirements');
      const r = await api('/requirements', {
        method: 'POST',
        body: { ...form, budgetMin: Number(form.budgetMin) || undefined, budgetMax: Number(form.budgetMax) || undefined, preferredTeacher: teacherId || undefined },
      });
      sessionStorage.removeItem(DRAFT_KEY);
      setDone(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (user && user.role !== 'student') {
    return (
      <div className="container page narrow center">
        <h1>Post Your Learning Requirement</h1>
        <p className="muted">Requirements are posted by students and parents. You are logged in as a {user.role}.</p>
        {user.role === 'teacher' && <Link href="/leads" className="btn btn-primary mt-m">Browse student leads instead</Link>}
      </div>
    );
  }

  if (done) {
    return (
      <div className="container page narrow center">
        <div className="success-icon"><Icon name="check" size={34} /></div>
        <h1>Requirement posted!</h1>
        <p className="muted">“{done.title}” is now visible to relevant teachers. They can only see your contact details after unlocking it{form.consent ? '' : ' – and only once you grant consent from your dashboard'}.</p>
        <div className="row gap-m center-row mt-m">
          <button className="btn btn-primary" onClick={() => router.push('/student')}>Go to my requirements</button>
          <Link href="/search" className="btn btn-outline">Browse teachers</Link>
        </div>
      </div>
    );
  }

  const catName = categories.find((c) => c.slug === form.category)?.name;

  return (
    <div className="container page narrow">
      <h1 className="center">Post Your Learning Requirement</h1>
      <p className="muted center">Tell us what you’re looking for and get matched with the best teachers.</p>
      {teacherName && <div className="alert alert-info mt-m">You’re contacting <b>{teacherName}</b>. They’ll be notified first, and other matching teachers can respond too.</div>}

      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'done' : i === step ? 'active' : ''}>
            <span className="step-dot">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
            <span className="step-label">{s}</span>
          </li>
        ))}
      </ol>

      <div className="card form-card">
        <Alert>{error}</Alert>

        {step === 0 && (
          <>
            <h3>Basic Details</h3>
            <label className="field">
              <span>Student’s Class <i className="req">*</i></span>
              <select value={form.studentClass} onChange={set('studentClass')}>
                <option value="">Select class</option>
                {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{classLabel(c)}</option>)}
              </select>
            </label>
            <div className="field">
              <span>Subject(s) <i className="req">*</i></span>
              <div className="tag-input">
                {form.subjects.map((s) => (
                  <span key={s} className="tag">{s}<button type="button" onClick={() => setForm({ ...form, subjects: form.subjects.filter((x) => x !== s) })} aria-label={`Remove ${s}`}>×</button></span>
                ))}
                <input
                  list="subject-list"
                  value={subjectInput}
                  placeholder={form.subjects.length ? 'Add another…' : 'Select or type subject(s)'}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (SUBJECT_SUGGESTIONS.includes(v)) addSubject(v);
                    else setSubjectInput(v);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSubject(subjectInput); } }}
                  onBlur={() => subjectInput && addSubject(subjectInput)}
                />
                <datalist id="subject-list">{SUBJECT_SUGGESTIONS.filter((s) => !form.subjects.includes(s)).map((s) => <option key={s} value={s} />)}</datalist>
              </div>
            </div>
            <div className="field">
              <span>Learning Mode <i className="req">*</i></span>
              <div className="radios">
                {[['home', 'At my home'], ['online', 'Online'], ['either', 'Either is fine']].map(([v, l]) => (
                  <label key={v} className="radio"><input type="radio" name="mode" checked={form.mode === v} onChange={() => setForm({ ...form, mode: v })} /> {l}</label>
                ))}
              </div>
            </div>
            <div className="field">
              <span>Location {form.mode !== 'online' && <i className="req">*</i>}</span>
              <div className="row gap-s">
                <input className="grow" value={form.location} onChange={set('location')} placeholder="Enter your area / locality" />
                <button type="button" className="btn btn-soft" onClick={detectLocation} disabled={locating}><Icon name="pin" size={16} /> {locating ? 'Detecting…' : 'Detect Location'}</button>
              </div>
            </div>
            <h3 className="mt-l">Additional Details</h3>
            <div className="textarea-wrap">
              <textarea rows={4} maxLength={300} value={form.details} onChange={set('details')} placeholder="Tell us more about your requirement (optional)" />
              <span className="counter">{form.details.length}/300</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3>Subject & Preferences</h3>
            <div className="grid-2 gap-m">
              <label className="field">
                <span>Category</span>
                <select value={form.category} onChange={set('category')}>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Current level</span>
                <input value={form.level} onChange={set('level')} placeholder="e.g. Beginner, CBSE, Intermediate" />
              </label>
            </div>
            <label className="field">
              <span>Title <span className="muted">(optional)</span></span>
              <input value={form.title} onChange={set('title')} placeholder={/^\d+$/.test(form.studentClass) ? `Class ${form.studentClass} - ${form.subjects.join(', ')}` : 'e.g. Python + SQL coaching for job switch'} />
            </label>
            <label className="field">
              <span>Learning goal</span>
              <input value={form.learningGoal} onChange={set('learningGoal')} placeholder="e.g. Improve board exam scores" />
            </label>
            <label className="field">
              <span>Preferred schedule</span>
              <input value={form.schedule} onChange={set('schedule')} placeholder="e.g. Weekday evenings, 3 days/week" />
            </label>
            <div className="field">
              <span>Budget</span>
              <div className="row gap-s">
                <input type="number" min="0" value={form.budgetMin} onChange={set('budgetMin')} placeholder="Min ₹" />
                <input type="number" min="0" value={form.budgetMax} onChange={set('budgetMax')} placeholder="Max ₹" />
                <select value={form.budgetUnit} onChange={set('budgetUnit')}>
                  {['hour', 'session', 'class', 'month', 'consult'].map((u) => <option key={u} value={u}>per {u}</option>)}
                </select>
              </div>
            </div>
            {form.mode !== 'online' && (
              <label className="field">
                <span>Full address <span className="muted">(shared only with teachers who unlock)</span></span>
                <input value={form.address} onChange={set('address')} placeholder="House no., street, area" />
              </label>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h3>Review & Submit</h3>
            <dl className="review-list">
              <dt>Class</dt><dd>{classLabel(form.studentClass)}</dd>
              <dt>Subjects</dt><dd>{form.subjects.join(', ')}</dd>
              <dt>Category</dt><dd>{catName}</dd>
              <dt>Mode</dt><dd>{MODE_LABEL[form.mode]}</dd>
              <dt>Location</dt><dd>{form.location || 'Online'}</dd>
              {form.schedule && <><dt>Schedule</dt><dd>{form.schedule}</dd></>}
              <dt>Budget</dt><dd>{budget({ ...form, budgetMin: Number(form.budgetMin), budgetMax: Number(form.budgetMax) })}</dd>
              {form.details && <><dt>Details</dt><dd>{form.details}</dd></>}
            </dl>
            <button type="button" className="link small" onClick={() => setStep(0)}>Edit details</button>

            {!user && (
              <div className="mt-l">
                <h4>Create your free account</h4>
                <p className="muted small">Already registered? <Link href="/login" state={{ from: '/post-requirement' }}>Log in</Link> – your draft is saved.</p>
                <div className="grid-2 gap-m">
                  <label className="field"><span>Your name</span><input value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} /></label>
                  <label className="field"><span>Email</span><input type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} /></label>
                </div>
                <label className="field"><span>Password</span><input type="password" value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} placeholder="At least 6 characters" /></label>
              </div>
            )}
            <label className="field mt-m">
              <span>Phone number for teachers</span>
              <input value={form.contactPhone} onChange={set('contactPhone')} placeholder={user?.phone || '+91 98xxxxxxxx'} />
            </label>
            <label className="check consent">
              <input type="checkbox" checked={form.consent} onChange={set('consent')} />
              <span>I consent to share my contact details with verified teachers who unlock this requirement. <span className="muted">You can change this later.</span></span>
            </label>
          </>
        )}
      </div>

      <div className="row-between mt-m">
        {step > 0 ? <button className="btn btn-outline" onClick={() => setStep(step - 1)}><Icon name="arrowLeft" size={16} /> Back</button> : <span />}
        {step < 2 ? (
          <button className="btn btn-primary btn-lg" onClick={next}>Next <Icon name="arrowRight" size={16} /></button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit Requirement'}</button>
        )}
      </div>
    </div>
  );
}
