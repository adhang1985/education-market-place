'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Icon from '@/components/Icon';
import { TeacherMiniCard } from '@/components/Cards';
import { Avatar, Badge, Spinner } from '@/components/ui';

const HOME_CATEGORIES = [
  { slug: 'school', title: 'School Tuition', sub: 'Classes 1–12, all boards', icon: 'book', tone: 'blue' },
  { slug: 'exams', title: 'Competitive Exams', sub: 'JEE, NEET, UPSC & more', icon: 'trophy', tone: 'orange' },
  { slug: 'languages', title: 'Languages', sub: 'English, French, Hindi', icon: 'globe', tone: 'teal' },
  { slug: 'music', title: 'Music & Arts', sub: 'Guitar, vocals, keyboard', icon: 'music', tone: 'pink' },
  { slug: 'programming', title: 'Coding & Tech', sub: 'Python, web dev, AI', icon: 'code', tone: 'violet' },
  { slug: 'wellness', title: 'Health & Wellness', sub: 'Yoga, meditation, fitness', icon: 'heartPulse', tone: 'green' },
];

const POPULAR = ['Mathematics', 'Physics', 'Spoken English', 'Guitar', 'Python', 'NEET'];

const FEATURES = [
  { icon: 'shield', tone: 'violet', title: 'Verified teachers', text: 'Every profile is reviewed by our team before it goes live in search.' },
  { icon: 'lock', tone: 'green', title: 'Privacy first', text: 'Your phone number stays hidden until you consent to be contacted.' },
  { icon: 'video', tone: 'blue', title: 'Online or at home', text: 'Choose live online classes or a tutor who comes to your doorstep.' },
  { icon: 'wallet', tone: 'orange', title: 'Fees that fit', text: 'Compare transparent hourly rates and pick what suits your budget.' },
];

const STEPS = {
  students: [
    { icon: 'search', title: 'Search or post', text: 'Browse verified teachers or post your requirement in under 2 minutes.' },
    { icon: 'users', title: 'Compare profiles', text: 'Check experience, ratings, fees and teaching mode side by side.' },
    { icon: 'chat', title: 'Start learning', text: 'Relevant teachers reach out only after you give consent.' },
  ],
  teachers: [
    { icon: 'user', title: 'Create your profile', text: 'Add your subjects, fees and experience. We verify it before it goes live.' },
    { icon: 'leads', title: 'Preview leads free', text: 'See each student’s goal, budget, schedule and area before you commit.' },
    { icon: 'unlock', title: 'Unlock & connect', text: 'Pro members unlock student contacts with credits and start teaching.' },
  ],
};

// Illustrative testimonials – replace with real reviews before launch.
const TESTIMONIALS = [
  { name: 'Ananya Sharma', role: 'Parent, Jaipur', text: 'Found a brilliant maths tutor for my daughter within a day. Her board exam score jumped from 68 to 91!' },
  { name: 'Rohit Verma', role: 'NEET aspirant, Delhi', text: 'The filters made it so easy to compare teachers. My biology mentor has been a game changer.' },
  { name: 'Kavita Iyer', role: 'Guitar teacher, Pune', text: 'TutorHub Pro paid for itself in the first week. I now teach 14 students, all from leads here.' },
];

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+` : `${n}+`);

function HeroArt() {
  return (
    <div className="hero-art fade-up d2" aria-hidden="true">
      <div className="hero-glow" />
      <div className="hero-profile">
        <div className="hp-head">
          <Avatar name="Priya Mehta" size={56} />
          <div>
            <div className="hp-name">Priya Mehta <Icon name="shield" size={16} /></div>
            <div className="hp-sub">Maths & Physics • Class 9–12</div>
          </div>
        </div>
        <div className="hp-stats">
          <div><b>4.9</b><span>Rating</span></div>
          <div><b>8 yrs</b><span>Experience</span></div>
          <div><b>320+</b><span>Students</span></div>
        </div>
        <div className="hp-tags">
          <Badge tone="green" icon="video">Online</Badge>
          <Badge tone="blue" icon="home">Home tuition</Badge>
          <Badge tone="violet" icon="crown">Pro</Badge>
        </div>
        <div className="hp-foot">
          <div className="hp-price">₹600 <small>/ hour</small></div>
          <span className="btn btn-primary btn-sm">Contact</span>
        </div>
      </div>
      <div className="hero-float f2">
        <span className="fi tone-green"><Icon name="check" size={18} strokeWidth={2.6} /></span>
        <div>Tutor matched!<small>Class 10 • Science</small></div>
      </div>
      <div className="hero-float f3">
        <span className="fi tone-amber"><Icon name="star" size={18} fill="currentColor" strokeWidth={0} /></span>
        <div>4.8 / 5<small>Average rating</small></div>
      </div>
      <div className="hero-float f1">
        <span className="fi tone-violet"><Icon name="bell" size={18} /></span>
        <div>3 new teachers responded<small>just now</small></div>
      </div>
    </div>
  );
}

export default function Home({ initialFeatured = null, initialStats = null }) {
  const router = useRouter();
  const [featured, setFeatured] = useState(initialFeatured);
  const [stats, setStats] = useState(initialStats);
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const [audience, setAudience] = useState('students');

  // Server-rendered data arrives as props; only fetch here if the server couldn't reach the API.
  useEffect(() => {
    if (!initialFeatured) api('/teachers/featured').then(setFeatured).catch(() => setFeatured([]));
    if (!initialStats) api('/stats').then(setStats).catch(() => {});
  }, [initialFeatured, initialStats]);

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ ...(q && { q }), ...(loc && { location: loc }) });
    const qs = params.toString();
    router.push(`/search${qs ? `?${qs}` : ''}`);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow pill fade-up"><span className="dot">New</span> 1-on-1 online classes now live</span>
            <h1 className="fade-up d1">
              Learn anything from <span className="accent">India’s best teachers</span>
            </h1>
            <p className="fade-up d1">Connect with verified tutors and mentors for school, competitive exams, music, coding and more. Online or at your home.</p>
            <form className="hero-search fade-up d2" onSubmit={search}>
              <div className="sb-field grow">
                <Icon name="search" size={20} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to learn?" aria-label="Subject or skill" />
              </div>
              <div className="sb-field sb-loc">
                <Icon name="pin" size={20} />
                <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="City" aria-label="City" />
              </div>
              <button className="btn btn-primary">Search</button>
            </form>
            <div className="popular fade-up d3">
              <span>Popular:</span>
              {POPULAR.map((p) => <Link key={p} href={`/search?q=${encodeURIComponent(p)}`}>{p}</Link>)}
            </div>
            <div className="trust-row fade-up d3">
              <div className="avatar-stack">
                {['Aarav K', 'Meera S', 'Ishaan P', 'Zoya R'].map((n) => <Avatar key={n} name={n} size={38} />)}
              </div>
              <div className="small">
                <div className="stars">★★★★★</div>
                <span className="muted">Trusted by <b>{stats ? fmt(stats.students) : 'thousands of'}</b> learners</span>
              </div>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      <div className="container">
        <div className="stats-strip">
          <div><b>{stats ? fmt(stats.teachers) : '—'}</b><span>Verified Teachers</span></div>
          <div><b>{stats ? fmt(stats.students) : '—'}</b><span>Students Connected</span></div>
          <div><b>{stats ? fmt(stats.subjects) : '—'}</b><span>Subjects & Skills</span></div>
          <div><b>{stats ? `${stats.rating}/5` : '—'}</b><span>Average Rating</span></div>
        </div>
      </div>

      <section className="section-block">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Categories</span>
              <h2>Explore what you can learn</h2>
              <p>From board exams to guitar riffs – pick a category to get started.</p>
            </div>
            <Link href="/categories" className="btn btn-outline">All categories <Icon name="arrowRight" size={16} /></Link>
          </div>
          <div className="home-cats">
            {HOME_CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/search?category=${c.slug}`} className="home-cat">
                <Icon name="arrowRight" size={18} className="go" />
                <div className={`home-cat-icon tone-${c.tone}`}><Icon name={c.icon} size={26} /></div>
                <b>{c.title}</b>
                <span className="muted small">{c.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block alt">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Top rated</span>
              <h2>Featured teachers</h2>
              <p>Hand-picked educators loved by students across India.</p>
            </div>
            <Link href="/search" className="btn btn-outline">View all teachers <Icon name="arrowRight" size={16} /></Link>
          </div>
          {!featured ? <Spinner /> : (
            <div className="grid-3">
              {featured.map((t) => <TeacherMiniCard key={t.id} t={t} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">Why TutorHub</span>
            <h2>Learning made simple, safe and personal</h2>
            <p>Everything you need to find the right teacher – without the guesswork.</p>
          </div>
          <div className="features">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature">
                <div className={`feature-icon tone-${f.tone}`}><Icon name={f.icon} size={24} /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="section-block alt">
        <div className="container">
          <div className="section-intro" style={{ marginBottom: 28 }}>
            <span className="eyebrow">How it works</span>
            <h2>Get started in three easy steps</h2>
          </div>
          <div className="center">
            <div className="how-toggle" role="tablist">
              <button role="tab" aria-selected={audience === 'students'} className={audience === 'students' ? 'active' : ''} onClick={() => setAudience('students')}>For Students</button>
              <button role="tab" aria-selected={audience === 'teachers'} className={audience === 'teachers' ? 'active' : ''} onClick={() => setAudience('teachers')}>For Teachers</button>
            </div>
          </div>
          <div className="steps">
            {STEPS[audience].map((s, i) => (
              <div key={s.title} className="step fade-up">
                <span className="step-num">STEP {i + 1}</span>
                <div className="step-icon"><Icon name={s.icon} size={26} /></div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
          <div className="how-cta">
            {audience === 'students'
              ? <Link href="/post-requirement" className="btn btn-primary btn-lg">Post a Requirement – it’s free</Link>
              : <Link href="/signup?role=teacher" className="btn btn-primary btn-lg">Join as a Teacher</Link>}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">Testimonials</span>
            <h2>Loved by learners and teachers</h2>
          </div>
          <div className="testimonials">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="card quote" style={{ margin: 0 }}>
                <div className="row-between">
                  <div className="stars">★★★★★</div>
                  <span className="quote-mark">“</span>
                </div>
                <p>{t.text}</p>
                <figcaption className="quote-who">
                  <Avatar name={t.name} size={44} />
                  <div><b>{t.name}</b><div className="muted small">{t.role}</div></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 96 }}>
        <div className="cta-band">
          <div>
            <span className="eyebrow" style={{ color: '#fff', opacity: 0.85 }}>For teachers</span>
            <h2>Turn your knowledge into a thriving tuition business</h2>
            <p>Join thousands of educators who get new students every week through TutorHub.</p>
            <div className="row gap-m wrap mt-l">
              <Link href="/signup?role=teacher" className="btn btn-white btn-lg">Start teaching</Link>
              <Link href="/for-teachers" className="btn btn-glass btn-lg">Explore Pro plan</Link>
            </div>
          </div>
          <ul className="cta-list">
            {['Free profile, verified by our team', 'Preview student leads at no cost', 'Unlock contacts with Pro credits', 'Teach online or in person'].map((x) => (
              <li key={x}><span className="tick"><Icon name="check" size={13} strokeWidth={3} /></span>{x}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
