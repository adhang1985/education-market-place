'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/Icon';
import { Alert, Avatar, Badge, Empty, FavoriteButton, Rating, Spinner } from '@/components/ui';
import { inr, timeAgo } from '@/lib/utils';

const TABS = ['About', 'Subjects & Classes', 'Reviews', 'Gallery'];
const SUBJECT_TONES = ['violet', 'green', 'pink', 'blue'];

function ReviewForm({ teacherId, onAdded }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onAdded(await api(`/teachers/${teacherId}/reviews`, { method: 'POST', body: { rating, comment } }));
      setComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="review-form" onSubmit={submit}>
      <Alert>{error}</Alert>
      <div className="row gap-s">
        <span className="small">Your rating:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} className={`star-btn ${n <= rating ? 'on' : ''}`} onClick={() => setRating(n)} aria-label={`${n} stars`}>★</button>
        ))}
      </div>
      <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience with this teacher" />
      <button className="btn btn-primary btn-sm" disabled={busy}>Submit review</button>
    </form>
  );
}

// `initial` is the public profile rendered on the server. Without it (e.g. a pending profile that only its
// owner or an admin may see) the profile is fetched in the browser with the user's token.
export default function TeacherProfile({ initial = null }) {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [t, setT] = useState(initial);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('About');

  useEffect(() => {
    if (!initial) api(`/teachers/${id}`).then(setT).catch((e) => setError(e.message));
    // The server render doesn't count as a view, so record it from the browser.
    else api(`/teachers/${id}/view`, { method: 'POST' }).catch(() => {});
  }, [id, initial]);

  if (error) return <div className="container page"><Empty title={error} icon="user" /></div>;
  if (!t) return <div className="container page"><Spinner /></div>;

  const contact = () => router.push(`/post-requirement?teacher=${t.id}&teacherName=${encodeURIComponent(t.name)}&subject=${encodeURIComponent(t.subjects[0]?.name || '')}`);
  const show = (name) => tab === name || (tab === 'About' && name !== 'Reviews' && name !== 'Gallery');

  return (
    <div className="container page profile">
      <button className="back-link" onClick={() => (window.history.length > 1 ? router.back() : router.push('/search'))}><Icon name="arrowLeft" size={15} /> Back to search</button>

      {t.status && t.status !== 'approved' && <div className="alert alert-warn">This profile is <b>{t.status}</b> and not yet visible to students.</div>}

      <div className="card profile-head">
        <Avatar name={t.name} src={t.avatar} size={110} />
        <div className="grow">
          <div className="row-between">
            <h1>{t.name}</h1>
            <FavoriteButton teacherId={t.id} />
          </div>
          <div className="row gap-s wrap">
            {t.verified && <Badge tone="blue" icon="shield">Verified Teacher</Badge>}
            {t.isPro && <Badge tone="violet" icon="crown">Pro</Badge>}
          </div>
          <div className="profile-meta">
            <Rating value={t.rating} count={t.reviewsCount} />
            <span><Icon name="clock" size={15} /> {t.experience} years experience</span>
            <span><Icon name="pin" size={15} /> {t.city}</span>
          </div>
          <div className="row gap-s wrap">
            {t.modes.includes('online') && <Badge tone="green" icon="video">Online Classes</Badge>}
            {t.modes.includes('home') && <Badge tone="green" icon="home">At Student’s Home</Badge>}
          </div>
        </div>
        <div className="profile-cta">
          <div className="price-lg">{inr(t.rate)}/hr</div>
          {user?.role !== 'teacher' && user?.role !== 'admin' && <button className="btn btn-primary btn-lg" onClick={contact}>Contact Now</button>}
        </div>
      </div>

      <div className="tabs">
        {TABS.map((x) => (
          <button key={x} className={tab === x ? 'active' : ''} onClick={() => setTab(x)}>{x}{x === 'Reviews' ? ` (${t.reviewsCount})` : ''}</button>
        ))}
      </div>

      {tab === 'About' && (
        <div className="card section">
          <h3>About Me</h3>
          <p>{t.bio || 'This teacher hasn’t added a bio yet.'}</p>
          <div className="facts">
            {t.qualification && <div><span className="fact-icon"><Icon name="grad" /></span><div><span className="muted small">Qualification</span><b>{t.qualification}</b></div></div>}
            {t.teachingSince && <div><span className="fact-icon"><Icon name="calendar" /></span><div><span className="muted small">Teaching Since</span><b>{t.teachingSince}</b></div></div>}
            {t.languages.length > 0 && <div><span className="fact-icon"><Icon name="chat" /></span><div><span className="muted small">Speaks</span><b>{t.languages.join(', ')}</b></div></div>}
          </div>
        </div>
      )}

      {show('Subjects & Classes') && (
        <div className="card section">
          <h3>Subjects & Classes</h3>
          <div className="subject-grid">
            {t.subjects.map((s, i) => (
              <div key={s.name} className="subject-tile">
                <div className={`subject-icon tone-${SUBJECT_TONES[i % 4]}`}><Icon name="book" size={20} /></div>
                <b>{s.name}</b>
                <span className="muted small">{s.display}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {show('Subjects & Classes') && (
        <div className="card section">
          <h3>Teaching Mode</h3>
          <div className="grid-2 gap-m">
            {t.modes.includes('online') && (
              <div className="mode-tile"><span className="tone-blue mode-icon"><Icon name="video" /></span><div><b>Online Classes</b><div className="muted small">({t.onlinePlatforms || 'Google Meet, Zoom'})</div></div></div>
            )}
            {t.modes.includes('home') && (
              <div className="mode-tile"><span className="tone-pink mode-icon"><Icon name="home" /></span><div><b>At Student’s Home</b><div className="muted small">({t.city})</div></div></div>
            )}
          </div>
        </div>
      )}

      {tab === 'Reviews' && (
        <div className="card section">
          <h3>Reviews</h3>
          {user?.role === 'student' && <ReviewForm teacherId={t.id} onAdded={(r) => setT({ ...t, reviews: [r, ...t.reviews], reviewsCount: t.reviewsCount + 1 })} />}
          {!user && <p className="muted small"><Link href="/login">Log in</Link> as a student to write a review.</p>}
          {t.reviews.length === 0 ? <p className="muted">No written reviews yet.</p> : t.reviews.map((r) => (
            <div key={r.id} className="review">
              <div className="row-between"><b>{r.student}</b><span className="muted small">{timeAgo(r.createdAt)}</span></div>
              <div className="stars">{'★'.repeat(r.rating)}<span className="dim">{'★'.repeat(5 - r.rating)}</span></div>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'Gallery' && (
        <div className="card section">
          <h3>Gallery</h3>
          {t.gallery.length === 0 ? <Empty title="No photos yet" icon="grid" /> : (
            <div className="gallery">{t.gallery.map((src) => <img key={src} src={src} alt="" />)}</div>
          )}
        </div>
      )}
    </div>
  );
}
